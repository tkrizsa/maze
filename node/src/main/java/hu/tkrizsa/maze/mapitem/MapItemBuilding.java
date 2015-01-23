package hu.tkrizsa.maze.mapitem;

import org.vertx.java.core.json.JsonObject;
import hu.tkrizsa.maze.*;

public class MapItemBuilding extends MapItem {

	private GameServer server;
	private String key;

	public MapItemBuilding(String className, GameServer server) {
		super(className);
		this.server = server;
	}

	public void setKey(String key) {
		this.key = key;
	}
	
	
	public void placeTo(Plain plain, int tileX, int tileY) throws Exception {
		throw new Exception("Not yet implemented.");
	}
	
	
	public JsonObject getMapData() {
		JsonObject data = new JsonObject();
		// data.putString("plainId", this.targetPlainId);
		// data.putNumber("x", this.targetX);
		// data.putNumber("y", this.targetY);
		return data;
	}
	
	public void setMapData(JsonObject data) {
		// this.targetPlainId = data.getString("plainId");
		// this.targetX = data.getInteger("x");
		// this.targetY = data.getInteger("y");
	}


}
