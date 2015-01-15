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
	
	// holds player who's disconnected and away from a section
	// only purpose to remove from section's away list if comes fast back here
	final Map<String, String> awayPlayers = new HashMap<String, String>(); // playerId -> sectionKey
	
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
		client.disconnected();
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
	

	
		// Handle playerId. required!
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
		
		if (client.playerId == null) {
			client.playerId = playerId;
			
			// if we just get a new playerId, check disconnected players, and remove this
			String ask = awayPlayers.get(playerId); // disconnected section key
			if (ask != null) {
				awayPlayers.remove(playerId);
				
				// if section, where player away from is here yet, remove from it's awayPlayer list too.
				Section asec = sections.get(ask);
				if (asec != null) {
					asec.removeAway(playerId);
				}
			}
		}
		
		
		// Handle player position. Not required!
		// if not present : he walks on a section of an other server, but he has subscibed section on this server
		JsonObject jpos = msg.getObject("playerPos");
		if (jpos != null) {
			// walks on this server 
			int x, y;
			x = jpos.getInteger("x");
			y = jpos.getInteger("y");
			
			String key = jpos.getString("key");
			Section section = sectionGet(key);
			
			client.setPlayer(section, x, y);
		} else {
			client.disconnectedAsPlayer();
		}
		
		
		
		// ======================= handle section subscriptions ========================
		
		// a list of newly subscribed sections. we use this list to unsubscribe every section, what's not in it.
		Map<String, Section> newSections = new HashMap<String, Section>();

		
		JsonArray jsections = msg.getArray("subscribe");
		if (jsections != null) {
			// prepare answer for already loaded sections
			JsonObject jresp = new JsonObject();
			jresp.putString("cmd", "init");
			JsonObject jresp_sections = new JsonObject();
			jresp.putObject("sections", jresp_sections);		
		
		
		
			for (int i = 0; i < jsections.size(); i++) {
				JsonObject jsection = jsections.get(i);
				String key = jsection.getString("key");
				if (key == null) {
					client.error("section key is null.");
					return;
				}
				Boolean mapNeeded = jsection.getBoolean("mapNeeded");
				
				Section section = sectionGet(key);
				
				section.clientAdd(client);
				client.sectionAdd(section);
				
				newSections.put(key, section);
			
				// if map needed, we return section map inmediately when already loaded
				if (mapNeeded != null && mapNeeded == true) {
					if (section.isLoaded()) {
						jresp_sections.putObject(section.getKey(), section.getJson(false, true));
					} else {
						// if map not loaded, after load it will be sent for every subscribed client
					}
				}
			}
			
			// unsubscribe from section not in the just sent list.
			client.sectionUnsubscribe(newSections);
			
			// answer with already loaded section's infos
			if (jresp_sections.size() > 0)
				client.write(jresp);
		}
		
		
		
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
		v0.addString(section.getJson(true, false).toString());
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