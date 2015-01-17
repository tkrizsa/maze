package hu.tkrizsa.maze.mapitem;

import org.vertx.java.core.json.JsonObject;


public class MapItemGate extends MapItem {
	
	public String targetPlainId;
	public int targetX;
	public int targetY;
	
	
	
	public MapItemGate() {
		super("Gate");
	}
	
	public MapItemGate(String targetPlainId, int targetX, int targetY) {
		this();
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
