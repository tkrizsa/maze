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

public class PlayerServer extends Verticle {

	private String serverId;
	public Map<String, Player> players = new HashMap<String, Player>();
	public Map<String, GameObject> objects = new HashMap<String, GameObject>();
	public SimpleFlake keygen = new SimpleFlake();

	public Player getPlayer(String playerId) {
		Player player = players.get(playerId);
		if (player== null) {
			player = new Player(playerId);
			players.put(playerId, player);
		
		}
		return player;
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
		final Logger logger = container.logger();
		final EventBus eventBus = vertx.eventBus();
		final JsonObject appConfig = container.config();
		System.out.println(appConfig.toString());
		
		serverId = appConfig.getString("serverId");
		
		logger.info("player server started ...." + serverId);
		loadObjects();
		
		
		eventBus.registerHandler("traverse#" + serverId, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> msg) {
				logger.info("TRAVERSE#" + serverId);
				JsonObject jresp = new JsonObject();
				jresp.putString("playerId", msg.body().getString("playerId"));
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
		
		eventBus.registerHandler("queryobjects", new Handler<Message<JsonArray>>() {
			@Override
			public void handle(Message<JsonArray> msg) {
				logger.info("QUERYOBJECTS");
				logger.info(msg.body().toString());
				JsonArray jresp = new JsonArray();
				JsonArray jkeys = msg.body();
				for (int i = 0; i < jkeys.size(); i++) {
					String key = (String)jkeys.get(i);
					GameObject obj = objects.get(key);
					if (obj != null) {
						System.out.println("* found : " + key);
						jresp.add(obj.getData());
					
					} else {
						System.out.println("* not found : " + key);
					}
				
				}
			
				eventBus.publish("objectdata", jresp);
			}
		});

		eventBus.registerHandler("getplayer", new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> msg) {
				logger.info("GETPLAYER");
				Player player = getPlayer(msg.body().getString("playerId"));
			
				msg.reply(player.getData());
			}
		});

		eventBus.registerHandler("build", new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> msg) {
				logger.info("BUILD");
				
				String playerId 	= msg.body().getString("playerId");
				String className 	= msg.body().getString("className");
				String plainId 		= msg.body().getString("plainId");
				Integer tileX		= msg.body().getInteger("tileX");
				Integer tileY		= msg.body().getInteger("tileY");
				
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
				
				
				GameObject newObject = createBuildingByClassName(className, plainId, tileX, tileY);
				
				if (newObject == null) {
					replyError(msg, "Invalid classname.");
					return;
				}
				
				newObject.addOwner(playerId, 100.0f);
				objects.put(newObject.getKey(), newObject);
				
				System.out.println("------> i respnose to build:");
				System.out.println(newObject.getData().toString());
				System.out.println("<------");
				
				msg.reply(newObject.getData());
				saveObject(newObject);
			}
		
		
		});
		

	}
	
	/* =========================================== cassandra ================================================ */
	public void saveObject(GameObject obj) {
		final EventBus eventBus = vertx.eventBus();
		
		JsonObject req = new JsonObject();
		req.putString("action", "prepared");
		req.putString("statement", "INSERT INTO maze.objects (objectKey, className, objectData) VALUES (?, ?, ?)");
		JsonArray v0 = new JsonArray();
		v0.addString(obj.getKey());
		v0.addString(obj.getClassName());
		v0.addString(obj.getData().toString());
		JsonArray values = new JsonArray();
		values.addArray(v0);
		req.putArray("values", values);
		
		
		eventBus.send("cassandra", req, new Handler<Message<JsonObject>>() {
			public void handle(Message<JsonObject> message) {	
				System.out.println("Cassandra reply to object save :  " + message.body());
			}
		});
	}
	
	public void loadObjects() {
		final EventBus eventBus = vertx.eventBus();
		
		JsonObject req = new JsonObject();
		req.putString("action", "raw");
		req.putString("statement", "SELECT * FROM maze.objects");
		
		
		eventBus.send("cassandra", req, new Handler<Message<JsonArray>>() {
			public void handle(Message<JsonArray> message) {
				System.out.println("Cassandra reply loadObjects() " + message.body());
				
				if (!(message.body() instanceof JsonArray))
					return;
				
				for (int i = 0; i < message.body().size(); i++) {
					JsonObject jrow = message.body().get(i);
					
					String objectKey = jrow.getString("objectkey");
					String className = jrow.getString("classname");
					JsonObject jdata = new JsonObject(jrow.getString("objectdata"));
					
					GameObject obj = createObjectByClassName(className);
					if (obj == null) {
						System.err.println("Class not found (loaded from db) : '" + (className==null?"NULL":className) + "'");
					}
					obj.setData(jdata);
					objects.put(obj.getKey(), obj);
					
					System.out.println("------------loaded object---------------");
					System.out.println(objectKey);
					System.out.println(obj.getKey());
					System.out.println(obj.getData().toString());
					System.out.println("------------");
					
				} 
			}
		});
	}
	
}