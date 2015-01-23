package hu.tkrizsa.maze.mapitem;

import org.vertx.java.core.json.JsonObject;
import hu.tkrizsa.maze.GameServer;

public class MapItemGate extends MapItemUniq {
	
	public String targetPlainId;
	public int targetX;
	public int targetY;
	
	
	
	public MapItemGate(GameServer server) {
		super("Gate", server);
	}
	
	public MapItemGate(GameServer server, String targetPlainId, int targetX, int targetY) {
		this(server);
		this.targetPlainId = targetPlainId;
		this.targetX = targetX;
		this.targetY = targetY;
		
	}
	
	public JsonObject getMapData() {
		JsonObject data = new JsonObject();
		data.putString("plainId", this.targetPlainId);
		data.putNumber("x", this.targetX);
		data.putNumber("y", this.targetY);
		return data;
	}
	
	public void setMapData(JsonObject data) {
		this.targetPlainId = data.getString("plainId");
		this.targetX = data.getInteger("x");
		this.targetY = data.getInteger("y");
	}
	
}
