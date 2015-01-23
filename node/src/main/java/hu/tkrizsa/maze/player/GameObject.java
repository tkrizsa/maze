package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import java.util.List;
import java.util.ArrayList;


public class GameObject {

	private String className;
	private PlayerServer server;
	private String key;
	private List<Owner> owners = new ArrayList<Owner>();
	
	
	
	
	public GameObject(String className, PlayerServer server) {
		this.className = className;
		this.server = server;
		this.key = server.generateKey();
	}
	
	public String getKey() {
		return key;
	}
	
	public void setKey(String key) {
		this.key = key;
	}
	
	public String getClassName() {
		return className;
	}
	
	public void addOwner(String playerId, float percent) {
		owners.add(new Owner(playerId, percent));
	}
	
	public JsonObject getData() {
		JsonObject jdata = new JsonObject();
		jdata.putString("objectKey", getKey());
		return jdata;
	}
	
	public void setData(JsonObject jdata) {
		System.out.println("itt es beallitom a key-t : " + jdata.getString("objectKey"));
		setKey(jdata.getString("objectKey"));
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


