package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import java.util.List;
import java.util.ArrayList;


public class GameObject {

	private PlayerServer server;
	private String key;
	private List<Owner> owners = new ArrayList<Owner>();
	
	
	
	
	public GameObject(PlayerServer server) {
		this.server = server;
		this.key = server.generateKey();
	}
	
	public String getKey() {
		return key;
	}
	
	public void addOwner(String playerId, float percent) {
		owners.add(new Owner(playerId, percent));
	}
	
	public JsonObject getData() {
		JsonObject jdata = new JsonObject();
		jdata.putString("key", getKey());
		return jdata;
	}
	
	/* ================================= Owner class ================================= */
	public class Owner {
		public String playerId;
		public float percent;
		
		public Owner(String playerId, float percent) {
			this.playerId 	= playerId;
			this.percent 	= percent;
		}
	}
	

}


