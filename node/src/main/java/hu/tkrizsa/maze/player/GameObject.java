package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import java.util.List;
import java.util.ArrayList;


public class GameObject {

	private String className;
	private PlayerServer server;
	private String objectId;
	private List<Owner> owners = new ArrayList<Owner>();
	
	
	
	
	public GameObject(String className, PlayerServer server) {
		this.className = className;
		this.server = server;
		this.objectId = server.generateKey();
	}
	
	public PlayerServer getServer() {
		return server;
	}
	
	public String getObjectId() {
		return objectId;
	}
	
	public void setObjectId(String objectId) {
		this.objectId = objectId;
	}
	
	public String getClassName() {
		return className;
	}
	
	public void addOwner(String playerId, float percent) {
		owners.add(new Owner(playerId, percent));
	}
	
	public JsonObject getData() {
		JsonObject jdata = new JsonObject();
		jdata.putString("className", getClassName());
		jdata.putString("objectId", getObjectId());
		return jdata;
	}
	
	public void setData(JsonObject jdata) {
		setObjectId(jdata.getString("objectId"));
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


