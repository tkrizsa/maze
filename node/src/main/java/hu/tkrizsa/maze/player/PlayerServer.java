package hu.tkrizsa.maze.player;


import org.vertx.java.platform.Verticle;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.Message;

import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.sockjs.SockJSServer;
import org.vertx.java.core.sockjs.SockJSSocket;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;

import java.util.Map;
import java.util.HashMap;
import hu.tkrizsa.maze.MazeServer;
import hu.tkrizsa.maze.util.DBHandler;

public class PlayerServer extends MazeServer {

	private String serverId;
	public Map<String, Player> players = new HashMap<String, Player>();
	public Map<String, GameObject> objects = new HashMap<String, GameObject>();
	public SimpleFlake keygen = new SimpleFlake();
	
	
	
	
	
	

	public Player getPlayer(String playerId) {
		return players.get(playerId);
		// Player player = players.get(playerId);
		// if (player== null) {
			// player = new Player(playerId);
			// players.put(playerId, player);
		
		// }
		// return player;
	}
	
	public GameObject createObjectByClassName(String className) {
		if ("Farm".equals(className)) return new Farm(this);
		return null;
	}
	
	public GameObjectBuilding createBuildingByClassName(String className, String plainId, int tileX, int tileY) {
		if ("Farm".equals(className)) return new Farm(this, plainId, tileX, tileY);
		return null;
	}
	
	public String generateKey() {
		return new Long(keygen.generate()).toString();
	}
	
	public void replyError(Message msg, String error) {
		JsonObject jerr = new JsonObject();
		jerr.putString("error", "Object server : " + error);
		msg.reply(jerr);
	}
	
	
	@Override
	public void start() {
		super.start();
		final Logger logger = container.logger();
		final EventBus eventBus = vertx.eventBus();
		final JsonObject appConfig = container.config();
		System.out.println(appConfig.toString());
		
		serverId = appConfig.getString("serverId");
		
		logger.info("player server started ...." + serverId);
		loadPlayers();
		loadObjects();
		
		
		eventBus.registerHandler("traverse#" + serverId, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> msg) {
				logger.info("TRAVERSE#" + serverId);
				JsonObject jresp = new JsonObject();
				jresp.putString("playerId", msg.body().getString("playerId"));
				jresp.putString("cmd", "init");
				JsonArray jrespObjects = new JsonArray();
				jresp.putArray("objects", jrespObjects);
				JsonArray jobjectIds = msg.body().getArray("getObjects");
				for (int i = 0; i < jobjectIds.size(); i++) {
					String objectId = jobjectIds.get(i);
					
					GameObject obj = objects.get(objectId);
					if (obj != null) {
						jrespObjects.addObject(obj.getData());
						continue;
					}
					
					Player player = getPlayer(objectId);
					if (player != null) {
						jrespObjects.addObject(player.getData());
						continue;
					}
				}
				
				eventBus.send(msg.body().getString("clientServerAddress"), jresp);

			}			
		});
		
		


		eventBus.registerHandler("player.create#" + serverId, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(final Message<JsonObject> origmsg) {
				logger.info("PLAYER.CREATE");
				final String playerId = origmsg.body().getString("playerId");
				final String loginId = origmsg.body().getString("loginId");
				
				if (playerId == null || "".equals(playerId)) {
					JsonObject jerr = new JsonObject();
					jerr.putString("status", "error");
					jerr.putString("message", "player.create : missing playerId");
					origmsg.reply(jerr);
				}
				if (loginId == null || "".equals(loginId)) {
					JsonObject jerr = new JsonObject();
					jerr.putString("status", "error");
					jerr.putString("message", "player.create : missing loginId");
					origmsg.reply(jerr);
				}
				
				loadLogin(loginId, new Handler<JsonObject>() {
					@Override
					public void handle(JsonObject jlogin) {
						if (jlogin == null) {
							JsonObject jerr = new JsonObject();
							jerr.putString("status", "error");
							jerr.putString("message", "loginid not found.");
							origmsg.reply(jerr);
						
						}
					
						final Player player = new Player(loginId, playerId);
						player.playerName = jlogin.getString("username");
						savePlayer(player, new Handler<JsonObject> () {
							@Override
							public void handle(JsonObject jresp) {
								if ("ok".equals(jresp.getString("status"))) {
									players.put(player.playerId, player);
								}
								origmsg.reply(jresp);
							}
						});
					
					}
				
				});
			}
		});

		eventBus.registerHandler("build#" + serverId, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> msg) {
				logger.info("BUILD");
				
				final String clientServerAddress 	= msg.body().getString("clientServerAddress");
				final String playerId 	= msg.body().getString("playerId");
				String objectId 				= msg.body().getString("objectId");
				String className 	= msg.body().getString("className");
				String plainId 		= msg.body().getString("plainId");
				Integer tileX		= msg.body().getInteger("tileX");
				Integer tileY		= msg.body().getInteger("tileY");
				
				if (objectId == null || "".equals(objectId)) {
					replyError(msg, "Missing object id in build.");
					return;
				}
				if (playerId == null || "".equals(playerId)) {
					replyError(msg, "Missing player id in build.");
					return;
				}
				if (plainId == null || "".equals(plainId)) {
					replyError(msg, "Missing plain id in build.");
					return;
				}
				if (tileX == null || tileY == null) {
					replyError(msg, "Missing tile coordinates in build.");
					return;
				}
				
				
				final GameObjectBuilding newObject = createBuildingByClassName(className, plainId, tileX, tileY);
				newObject.setObjectId(objectId); // should do in constructor
				
				if (newObject == null) {
					replyError(msg, "Invalid classname.");
					return;
				}
				
				newObject.addOwner(playerId, 100.0f);
				
				newObject.placeIt(new Handler<String> () {
					@Override
					public void handle(String msg) {
						if (!("ok".equals(msg))) {
							JsonObject jerr = new JsonObject();
							jerr.putString("error", msg);
							jerr.putString("playerId", playerId);
							eventBus.send(clientServerAddress, jerr);
						} else {
							objects.put(newObject.getObjectId(), newObject);
							saveObject(newObject);
						
						}
					
					}
				
				});
				
				// 
				
				// System.out.println("------> i respnose to build:");
				// System.out.println(newObject.getData().toString());
				// System.out.println("<------");
				
				// msg.reply(newObject.getData());
				// saveObject(newObject);
			}
		
		
		});
		

	}
	
	/* =========================================== cassandra ================================================ */
	public void saveObject(GameObject obj) {
		dbQuery("INSERT INTO maze.objects (objectKey, className, objectData) VALUES (?, ?, ?)")
		.addString(obj.getObjectId())
		.addString(obj.getClassName())
		.addString(obj.getData().toString())
		.run();
	}
	
	public void loadObjects() {
		dbQuery("SELECT * FROM maze.objects")
		.run(new DBHandler(true) {
			public void each(JsonObject jrow) {
				String objectKey = jrow.getString("objectkey");
				String className = jrow.getString("classname");
				JsonObject jdata = new JsonObject(jrow.getString("objectdata"));
				
				GameObject obj = createObjectByClassName(className);
				if (obj == null) {
					System.err.println("Class not found (loaded from db) : '" + (className==null?"NULL":className) + "'");
				}
				obj.setData(jdata);
				objects.put(obj.getObjectId(), obj);
			}
		});
	}
	
	public void loadPlayers() {
		dbQuery("SELECT * FROM maze.players")
		.run(new DBHandler(true) {
			@Override
			public void each(JsonObject jrow) {
				String loginId = jrow.getString("loginid");
				String playerId = jrow.getString("playerid");
				//JsonObject jdata = new JsonObject(jrow.getString("objectdata"));
				Player obj = new Player(loginId, playerId);
				obj.playerName = jrow.getString("playername");
				players.put(playerId, obj);
			}
		});
	}

	public void loadLogin(final String loginId, final Handler<JsonObject> callHandler)  {
		dbQuery("SELECT * FROM maze.logins WHERE loginId = ?")
		.addString(loginId)
		.run(new DBHandler(true) {
			@Override
			public void each(JsonObject jrow) {
				callHandler.handle(jrow);
			}
			@Override
			public void notExistsOrFail() {
				callHandler.handle(null);
			}
		});
	}
	
	public void savePlayer(final Player player, final Handler<JsonObject> callHandler) {
		dbQuery("INSERT INTO maze.players (playerid, loginid_worldid, playername) VALUES (?, ?, ?)")
		.addString(player.playerId)
		.addString(player.loginId + "#" + getWorldId())
		.addString(player.playerName)
		.run(new DBHandler(false) {
			@Override
			public void success() {
				callHandler.handle(joSuccess());
			}
			@Override
			public void fail(JsonObject jerror) {
				callHandler.handle(jerror);
			}
		});
	}	
}