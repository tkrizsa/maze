package hu.tkrizsa.maze.mapitem;

import hu.tkrizsa.maze.GameServer;
import org.vertx.java.core.json.JsonObject;

public class MapItemUniq extends MapItem {
	private GameServer server;
	private String key;
	private boolean loaded = false;
	
	public MapItemUniq(String className, GameServer server) {
		super(className);
		this.server = server;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getKey() {
		return key;
	}
	
	public GameServer getServer() {
		return server;
	}
	
	public boolean isLoaded() {
		return loaded;
	}
	
	public void setLoaded(boolean loaded) {
		this.loaded = loaded;
	}
	
	public JsonObject getMapData() {
		JsonObject jdata = new JsonObject();
		jdata.putString("className", getClassName());
		jdata.putString("objectKey", getKey());
		return jdata;
	}
		
	public void setData(JsonObject jdata) {
		setKey(jdata.getString("objectKey"));
	}
}