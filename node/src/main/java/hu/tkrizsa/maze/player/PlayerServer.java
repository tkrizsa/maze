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
		//if ("Farm".equals(className)) return new Farm(this);
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
		
		logger.info("player server started ....");
		
		
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
				
				msg.reply(newObject.getData());
			}
		
		
		});

	}
}