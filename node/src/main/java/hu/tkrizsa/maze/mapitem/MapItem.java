package hu.tkrizsa.maze.mapitem;

import org.vertx.java.core.json.JsonObject;


public class MapItem {
	private String className;
	
	public MapItem(String className) {
		this.className = className;
	}
	
	public String getClassName() {
		return className;
	}
	
	public JsonObject getMapData() {
		// update it in uniq objects
		return null;
	}
	
	public void setMapData(JsonObject data) {
		// update it in uniq objects
	}
	
}
