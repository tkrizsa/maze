package hu.tkrizsa.maze.util;

import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import hu.tkrizsa.maze.MazeServer;


public class DBQuery  {

	private MazeServer server;
	private JsonObject req;
	private JsonArray currValues;

	
	public DBQuery(MazeServer server, String statement) {
		this.server = server;
		
		req = new JsonObject();
		req.putString("statement", statement);
	}
	
	
	private void prepareAdd() {
		if (currValues == null) {
			JsonArray values = new JsonArray();
			req.putArray("values", values);
			currValues = new JsonArray();
			values.addArray(currValues);
		}
	}

	public DBQuery addString(String arg) {
		prepareAdd();
		currValues.addString(arg);
		return this;
	}
	
	public DBQuery addObject(JsonObject arg) {
		prepareAdd();
		currValues.addObject(arg);
		return this;
	}
	
	
	
	public void run() {
		run(null);
	}
	
	public void run(DBHandler handler) {
		if (currValues != null) {
			req.putString("action", "prepared");
		} else {
			req.putString("action", "raw");
		}
	
	
		if (handler != null) 
			server.getEventBus().send("cassandra", req, handler);
		else 
			server.getEventBus().send("cassandra", req);
	}

	
}