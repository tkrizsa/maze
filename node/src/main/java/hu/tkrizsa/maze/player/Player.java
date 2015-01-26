package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;


public class Player {
	public static int pc = 0;
	public String playerId;
	public String playerName;
	public String headColor;
	
	public Player(String playerId) {
		this.playerId = playerId;
		if (pc == 0) {
			this.playerName = "tkrizsa";
			this.headColor = "#324684"; //blue
		} else {
			this.playerName = "user" + pc;
			this.headColor = "#952620"; //red
		}
		pc++;
		
	}
	
	public JsonObject getData() {
		JsonObject jdata = new JsonObject ();
		jdata.putString("playerId", playerId);
		jdata.putString("playerName", playerName);
		jdata.putString("headColor", headColor);
		return jdata;
	}

}