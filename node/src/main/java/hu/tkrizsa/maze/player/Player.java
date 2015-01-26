package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;


public class Player {
	public String playerId;
	public String loginId;
	public String playerName;
	public String headColor;
	
	
	public Player(String loginId, String playerId) {
		this.loginId = loginId;
		this.playerId = playerId;
		this.playerName = "";
		this.headColor = "#324684"; //blue
		//this.headColor = "#952620"; //red
		
	}
	
	public JsonObject getData() {
		JsonObject jdata = new JsonObject ();
		jdata.putString("playerId", playerId);
		jdata.putString("playerName", playerName);
		jdata.putString("headColor", headColor);
		return jdata;
	}

}