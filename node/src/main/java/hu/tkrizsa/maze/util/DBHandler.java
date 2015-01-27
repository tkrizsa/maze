package hu.tkrizsa.maze.util;

import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;


public abstract class DBHandler implements Handler<Message<JsonElement>> {
	
	public enum Mode {RES, NORES};
	
	private Mode mode;

	public DBHandler(boolean resultExcepted) {
		this.mode = resultExcepted ? Mode.RES : Mode.NORES;
	}

	@Override
	public void handle(Message<JsonElement> message) {
	
		System.out.println("=================== DBHandler returned ==========================");
		System.out.println(message.body());
	
		if (mode == Mode.NORES || !(message.body() instanceof JsonArray)) {
			if (!(message.body() instanceof JsonObject)) {
				callFail("db result not jsonobject");
				return;
			}
		
			JsonObject jobj = (JsonObject)message.body();
			if (mode == Mode.NORES && "ok".equals(jobj.getString("status"))) {
				success();
			} else {
				callFail(jobj);
			}
			return;
		}
	
		
	

		JsonArray jarr = (JsonArray)message.body();
		if (jarr.size() == 0) {
			notExists();
			notExistsOrFail();
		} else {
			for (int i = 0; i < jarr.size(); i++) {
				each((JsonObject)jarr.get(i));
			}
		}
	}

	
	private void callFail(String error) {
		JsonObject jerr = new JsonObject();
		jerr.putString("status", "error");
		jerr.putString("message", error);
		fail(jerr);
		fail(error);
		notExistsOrFail();
	}
	
	private void callFail(JsonElement jres) {
		if (jres instanceof JsonObject && ((JsonObject)jres).getString("message") != null) {
			fail((JsonObject)jres);
			fail(((JsonObject)jres).getString("message"));
		} else {
			callFail("db error");
		}
		notExistsOrFail();
	}
	
	public JsonObject joSuccess() {
		JsonObject jo = new JsonObject();
		jo.putString("status", "ok");
		return jo;
	}
	
	// methods to override
	
	public void each(JsonObject row) {
	
	}
	
	public void success() {
	
	}
	
	public void fail(String message) {
		System.err.println(message);
	}
	
	public void fail(JsonObject jobj) {
	
	}
	
	public void notExists() {
	
	}
	
	public void notExistsOrFail() {
	
	}
	
}