package hu.tkrizsa.maze.mapserver;

import org.vertx.java.core.json.JsonObject;


public class Plain {
	private String plainId;
	private int left;
	private int right;
	private int top;
	private int bottom;
	private String defaultFloor;
	
	public Plain(String plainId) {
		this.plainId = plainId;
	}
	
	public Plain(String plainId, int left, int right, int top, int bottom, String defaultFloor) {
		this(plainId);
		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
		this.defaultFloor = defaultFloor;
		
	}

	public String getPlainId() {
		return plainId;
	}
	
	
	public void setData(JsonObject data) {
		this.left 			= Integer.parseInt(data.getString("left"));
		this.right 			= Integer.parseInt(data.getString("right"));
		this.top 			= Integer.parseInt(data.getString("top"));
		this.bottom 		= Integer.parseInt(data.getString("bottom"));
		this.defaultFloor	= data.getString("defaultFloor");
	}
	
	public JsonObject getData() {
		JsonObject data = new JsonObject();
		data.putString("left", ""+left);
		data.putString("right", ""+right);
		data.putString("top", ""+top);
		data.putString("bottom", ""+bottom);
		data.putString("defaultFloor", defaultFloor);
		return data;
	}
	
	public boolean checkSectionKey(String key) {
		// return false if section coordinates are out of bounds
		return true;
	}
	
	public int getLeft() {
		return left;
	}
	
	public int getRight() {
		return right;
	}
	
	public int getTop() {
		return top;
	}
	
	public int getBottom() {
		return bottom;
	}
	
	public String getDefaultFloor() {
		return defaultFloor;
	}
	
}
