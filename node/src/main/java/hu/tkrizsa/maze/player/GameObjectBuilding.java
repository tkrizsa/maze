package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import java.util.List;
import java.util.ArrayList;
import hu.tkrizsa.maze.util.SmallMap;


public class GameObjectBuilding extends GameObject {

	private String plainId;
	private int tileX;
	private int tileY;
	private int tileWidth;
	private int tileHeight;
	private int tileOffX;
	private int tileOffY;
	
	
	public GameObjectBuilding(String className, PlayerServer server) {
		super(className, server);
	}
	
	public GameObjectBuilding(String className, PlayerServer server, String plainId, int tileX, int tileY, int tileWidth, int tileHeight, int tileOffX, int tileOffY) {
		super(className, server);
		
		this.plainId 		= plainId;
		this.tileX 			= tileX;
		this.tileY 			= tileY;
		this.tileWidth 		= tileWidth;
		this.tileHeight 	= tileHeight;
		this.tileOffX 		= tileOffX;
		this.tileOffY 		= tileOffY;
	}

	@Override
	public JsonObject getData() {
		JsonObject jdata = super.getData();
		jdata.putString("plainId"		, plainId);
		jdata.putNumber("tileX"			, tileX);
		jdata.putNumber("tileY"			, tileY);
		jdata.putNumber("tileWidth"		, tileWidth);
		jdata.putNumber("tileHeight"	, tileHeight);
		jdata.putNumber("tileOffX"		, tileOffX);
		jdata.putNumber("tileOffY"		, tileOffY);
		return jdata;
	}
	
	@Override 
	public void setData(JsonObject jdata) {
		super.setData(jdata);
		plainId 		= jdata.getString("plainId");
		tileX 			= jdata.getInteger("tileX");
		tileY 			= jdata.getInteger("tileY");
		tileWidth 		= jdata.getInteger("tileWidth");
		tileHeight 		= jdata.getInteger("tileHeight");
		tileOffX 		= jdata.getInteger("tileOffX");
		tileOffY 		= jdata.getInteger("tileOffY");
	
	}
	
	
	private class ResponseCounter {
		public int responseCount = 0;
	}
	
	public void placeIt(final Handler<String> clientHandler) {
		final List<String> servers = new ArrayList<String>();
		
		// collect involved MapServers
		for (int y = tileY + tileOffY; y < tileY + tileOffY + tileHeight; y ++) {
			for (int x = tileX + tileOffX; x < tileX + tileOffX + tileWidth; x ++) {
				String sectionKey = getServer().createSectionKey(plainId, x, y);
				String serverId = getServer().getMapServerId(sectionKey);
				if (!servers.contains(serverId)) 
					servers.add(serverId);
				
			}
		}
		
		// send build.temp for all mapservers
		final ResponseCounter rc = new ResponseCounter();
		JsonObject jobj = this.getData();
		
		for (String serverId : servers) {
			getServer().getEventBus().send("build.temp#" + serverId, jobj, new Handler<Message<JsonObject>>() {
				@Override 
				public void handle(Message<JsonObject> msg) {
					System.out.println("--------------- build temp returned ----------------------");
					System.out.println(msg.body());
					if ("ok".equals(msg.body().getString("status"))) {
						rc.responseCount++;
						if (rc.responseCount == servers.size()) {
							clientHandler.handle("ok");
						}
					} else {
						String error = msg.body().getString("message");
						if (error == null) 
							error = "something went wrong with build (temp phase)";
						clientHandler.handle(error);
					}
				
				}
			
			
			});
		
		}
	
	}

}


