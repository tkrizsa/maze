package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;


public class Player {
	public static int pc = 0;
	public String playerId;
	public String playerName;
	
	public Player(String playerId) {
		this.playerId = playerId;
		if (pc == 0) {
			this.playerName = "tkrizsa";
		} else {
			this.playerName = "user" + pc;
		}
		pc++;
		
	}
	
	public JsonObject getData() {
		JsonObject jdata = new JsonObject ();
		jdata.putString("playerId", playerId);
		jdata.putString("playerName", playerName);
		return jdata;
	}

}