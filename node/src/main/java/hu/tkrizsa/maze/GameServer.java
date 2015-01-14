package hu.tkrizsa.maze;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;

import java.util.Map;
import java.util.HashMap;

import hu.tkrizsa.maze.mapitem.*;

public class GameServer {
	private EventBus eventBus;

	private final Map<String, MapItem> mapItemSingletones = new HashMap<String, MapItem>();
	{
		mapItemSingletones.put("GrassFloor", 		new MapItemFloor("GrassFloor"));
		mapItemSingletones.put("TileFloor1", 		new MapItemFloor("TileFloor1"));
		mapItemSingletones.put("TileFloor2", 		new MapItemFloor("TileFloor2"));
		mapItemSingletones.put("TileFloor3", 		new MapItemFloor("TileFloor3"));
		
		mapItemSingletones.put("SandFloor", 		new MapItemFloor("SandFloor"));
		mapItemSingletones.put("WaterFloor", 		new MapItemFloor("WaterFloor"));
		mapItemSingletones.put("RockFloor", 		new MapItemFloor("RockFloor"));
		
		mapItemSingletones.put("BrickWall1", 		new MapItem("BrickWall1"));
		mapItemSingletones.put("BrickWall2", 		new MapItem("BrickWall2"));
		mapItemSingletones.put("BrickWall3", 		new MapItem("BrickWall3"));
		
		mapItemSingletones.put("Tree1", 			new MapItem("Tree1"));
		mapItemSingletones.put("Tree2", 			new MapItem("Tree2"));
	}

	
	final Map<String, Client> clients = new HashMap<String, Client>();
	final Map<String, Section> sections = new HashMap<String, Section>();
	
	public final static int SECTION_SIZE = 16;

	public GameServer(EventBus eventBus) {
		this.eventBus = eventBus;
	}
	
	public MapItem getSingle(String className) {
		return mapItemSingletones.get(className);
	}
	
	public void clientConnected(Client client) {
		clients.put(client.getKey(), client);
	}
	
	public void clientRemove(Client client) {
		client.remove();
		clients.remove(client.getKey());
	}
	
	public void clientMessage(Client client, JsonObject msg) {
		String cmd = msg.getString("cmd");
	
		if ("init".equals(cmd)) {
			clientMessageInit(client, msg);
		} else if ("draw".equals(cmd)) {
			clientMessageDraw(client, msg);
		} else {
			client.error("unknown command : " + cmd);
		
		}
	
		/*JsonObject resp = new JsonObject();
		resp.putString("Hello", "Leo");
		resp.putString("cmd", cmd);
		client.write(resp);*/
		
		
	
	}

	public void clientMessageInit(Client client, JsonObject msg) {
	
		JsonObject jresp = new JsonObject();
		JsonObject jresp_sections = new JsonObject();
		jresp.putObject("sections", jresp_sections);
	
		JsonObject jplayer = msg.getObject("player");
		if (jplayer == null) {
			client.error("player is null");
			return;
		}
		
		String playerId = jplayer.getString("id");
		if (playerId == null || "".equals("playerId")) {
			client.error("no player id.");
			return;
		}
		
		client.playerId = playerId;
		JsonObject jpos = msg.getObject("playerPos");
		if (jpos != null) {
			int x, y;
			x = jpos.getInteger("x");
			y = jpos.getInteger("y");
			
			String key = jpos.getString("key");
			Section section = sectionGet(key);
			
			client.setPlayer(section, x, y);
		} else {
			client.removePlayer();
		}
		
		
		
		// ======================= handle section subscriptions ========================
		Map<String, Section> newSections = new HashMap<String, Section>();
		JsonArray jsections = msg.getArray("sections");
		if (jsections != null) {
			for (int i = 0; i < jsections.size(); i++) {
				Object okey = jsections.get(i);
				if (okey == null) {
					client.error("section key is null.");
					return;
				}
				String key = okey.toString();
				Section section = sectionGet(key);
				
				section.clientAdd(client);
				client.sectionAdd(section);
				newSections.put(key, section);
			
				if (section.isLoaded()) {
					jresp_sections.putObject(section.getKey(), section.getJson(false));
				}
			}
		}
		client.sectionUnsubscribe(newSections);
		
		
		// answer with already loaded section's infos
		client.write(jresp);
	}

	public void clientMessageDraw(Client client, JsonObject msg) {
		String key 			= msg.getString("sectionKey");
		if (key == null) {
			System.out.println("key is null");
			return;
		}
		Section section 	= sectionGet(key);
		Integer x 			= msg.getInteger("x");
		Integer y 			= msg.getInteger("y");
		String className	= msg.getString("className");
		MapItem item		= getSingle(className);
		if (item == null) {
			System.out.println("Class not found : " + className);
			return;
		}
		
		
		section.draw(x, y, item);
	}
	
	public Section sectionGet(String key) {
		Section section = sections.get(key);
		if (section != null) {
			return section;
		}
		
		section = new Section(this, key);
		sections.put(key, section);
		return section;
	
	
	}
	
	/* ======================================= CASSANDRA ============================================= */
	public void saveSection(Section section) {
		JsonObject req = new JsonObject();
		req.putString("action", "prepared");
		req.putString("statement", "INSERT INTO maze.sections (key, map) VALUES (?, ?)");
		JsonArray v0 = new JsonArray();
		v0.addString(section.getKey());
		v0.addString(section.getJson(true).toString());
		JsonArray values = new JsonArray();
		values.addArray(v0);
		req.putArray("values", values);
		
		
		eventBus.send("cassandra", req, new Handler<Message<JsonObject>>() {
			public void handle(Message<JsonObject> message) {
				System.out.println("Cassandra reply " + message.body());
			}
		});
	}
	
	public void loadSection(final Section section) {
		JsonObject req = new JsonObject();
		req.putString("action", "prepared");
		req.putString("statement", "SELECT key, map FROM maze.sections WHERE key = ?");
		JsonArray v0 = new JsonArray();
		v0.addString(section.getKey());
		JsonArray values = new JsonArray();
		values.addArray(v0);
		req.putArray("values", values);
		
		
		eventBus.send("cassandra", req, new Handler<Message<JsonArray>>() {
			public void handle(Message<JsonArray> message) {
				//System.out.println("Cassandra reply " + message.body());
				if (message.body().size()>0) {
					JsonObject row0 = message.body().get(0);
					JsonObject map = new JsonObject(row0.getString("map"));
					section.loaded(map);
				} else {
					section.notExists();
				}
				
			}
		});
	}
}