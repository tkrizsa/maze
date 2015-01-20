package hu.tkrizsa.maze;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;

import java.util.Map;
import java.util.HashMap;
import java.util.Random;

import hu.tkrizsa.maze.mapitem.*;

public class GameServer {
	private EventBus eventBus;

	private final Map<String, MapItem> mapItemSingletones = new HashMap<String, MapItem>();
	{
		mapItemSingletones.put("Nothing", 			new MapItemFloor("Nothing"));
		
		mapItemSingletones.put("GrassFloor", 		new MapItemFloor("GrassFloor"));
		mapItemSingletones.put("TileFloor1", 		new MapItemFloor("TileFloor1"));
		mapItemSingletones.put("TileFloor2", 		new MapItemFloor("TileFloor2"));
		mapItemSingletones.put("TileFloor3", 		new MapItemFloor("TileFloor3"));
		
		mapItemSingletones.put("SandFloor", 		new MapItemFloor("SandFloor"));
		mapItemSingletones.put("SandFloor2", 		new MapItemFloor("SandFloor2"));
		mapItemSingletones.put("WaterFloor", 		new MapItemFloor("WaterFloor"));
		mapItemSingletones.put("WaterFloor2", 		new MapItemFloor("WaterFloor2"));
		mapItemSingletones.put("RockFloor", 		new MapItemFloor("RockFloor"));
		mapItemSingletones.put("RockFloor2", 		new MapItemFloor("RockFloor2"));
		mapItemSingletones.put("SnowFloor", 		new MapItemFloor("SnowFloor"));
		mapItemSingletones.put("SwampFloor", 		new MapItemFloor("SwampFloor"));
		mapItemSingletones.put("SwampFloor2", 		new MapItemFloor("SwampFloor2"));
		mapItemSingletones.put("SwampWaterFloor", 		new MapItemFloor("SwampWaterFloor"));
		
		mapItemSingletones.put("BrickWall1", 		new MapItem("BrickWall1"));
		mapItemSingletones.put("BrickWall2", 		new MapItem("BrickWall2"));
		mapItemSingletones.put("BrickWall3", 		new MapItem("BrickWall3"));
		
		mapItemSingletones.put("Tree1", 			new MapItem("Tree1"));
		mapItemSingletones.put("Tree2", 			new MapItem("Tree2"));
		mapItemSingletones.put("Tree3", 			new MapItem("Tree3"));
		mapItemSingletones.put("TreePine1",			new MapItem("TreePine1"));
		mapItemSingletones.put("TreePine2",			new MapItem("TreePine2"));
		mapItemSingletones.put("TreeBold1",			new MapItem("TreeBold1"));
		mapItemSingletones.put("TreeBold2",			new MapItem("TreeBold2"));
		mapItemSingletones.put("TreeBold3",			new MapItem("TreeBold3"));
		mapItemSingletones.put("TreePalm1",			new MapItem("TreePalm1"));
		mapItemSingletones.put("TreePalm2",			new MapItem("TreePalm2"));
		mapItemSingletones.put("TreePalm3",			new MapItem("TreePalm3"));
		mapItemSingletones.put("TreePalm4",			new MapItem("TreePalm4"));
		mapItemSingletones.put("Bush1",				new MapItem("Bush1"));
		mapItemSingletones.put("Bush2",				new MapItem("Bush2"));
		
		mapItemSingletones.put("Rock1",				new MapItem("Rock1"));
		mapItemSingletones.put("Rock2",				new MapItem("Rock2"));
		mapItemSingletones.put("Rock3",				new MapItem("Rock3"));
		
		mapItemSingletones.put("School",			new MapItem("School"));
	}

	
	final Map<String, Plain> plains = new HashMap<String, Plain>();
	final Map<String, Client> clients = new HashMap<String, Client>();
	final Map<String, Section> sections = new HashMap<String, Section>();
	
	// holds player who's disconnected and away from a section
	// only purpose to remove from section's away list if comes fast back here
	final Map<String, String> awayPlayers = new HashMap<String, String>(); // playerId -> sectionKey
	
	public final static int SECTION_SIZE = 16;

	public GameServer(EventBus eventBus) {
		this.eventBus = eventBus;
		
		this.loadPlains();
	}
	
	public MapItem getSingle(String className) {
		return mapItemSingletones.get(className);
	}
	
	public MapItem getMapItem(String className) {
		if ("Gate".equals(className)) {
			return new MapItemGate();
		} else {
			return getSingle(className);
		}
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
		} else if ("dig".equals(cmd)) {
			clientMessageDig(client, msg);
		} else {
			client.error("unknown command : " + cmd);
		
		}
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
			if (section == null) {
				client.error("Invalid section : " + key);
				return;
			}
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
				if (section == null) {
					client.error("Invalid section : " + key);
					return;
				}
				
				
				section.subscriberAdd(client);
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

	public void clientMessageDraw(Client client, JsonObject xmsg) {
		Map<String, Section> secs = new HashMap<String, Section>();
		JsonArray jitems = xmsg.getArray("items");
		for (int j = 0; j < jitems.size(); j++) {
			JsonObject msg = (JsonObject)jitems.get(j);
	
			String key 			= msg.getString("sectionKey");
			if (key == null) {
				client.error("key is null");
				return;
			}
			Section section 	= sectionGet(key);
			if (section == null) {
				client.error("Invalid section : " + key);
				return;
			}
			
			if (!section.isLoaded()) {
				client.error("Section not loaded.");
				return;
			}
			
			secs.put(section.getKey(), section);
			
			Integer x 			= msg.getInteger("x");
			Integer y 			= msg.getInteger("y");
			String className	= msg.getString("className");
			MapItem item		= getSingle(className);
			if (item == null) {
				client.error("Class not found : " + className);
				return;
			}
			
			
			section.draw(x, y, item);
		}
		for (Section section : secs.values()) {
			section.drawEnd();
		}
	}
	
	public void clientMessageDig(Client client, JsonObject msg) {
		String plainId = msg.getString("plainId");
		if (plainId == null) {
			client.error("plainId is null");
			return;
		}
		Integer x = msg.getInteger("x");
		if (x == null) {
			client.error("x is null");
			return;
		}
		Integer y = msg.getInteger("y");
		if (y == null) {
			client.error("y is null");
			return;
		}
		String key = createSectionKey(plainId, x,  y);
		
		Section section 	= sectionGet(key);
		if (section == null) {
			client.error("Invalid section : " + key);
			return;
		}
		
		if (!section.isLoaded()) {
			client.error("Section not loaded.");
			return;
		}

		Random rn = new Random();
		int n = 999999 - 100000 + 1;
		int i = rn.nextInt() % n;
		int randomNum =  100000 + i;
		String cavePlainId = "cave" + randomNum;
		String caveSectionKey = cavePlainId + "#0#0";
		
		Plain cavePlain = new Plain(cavePlainId, 0, 10, 0, 10, "RockFloor");
		plains.put(cavePlainId, cavePlain);
		savePlain(cavePlain);
		
		Section caveSection = new Section(this, cavePlain, caveSectionKey);
		sections.put(caveSectionKey, caveSection);
		caveSection.notExists();

		MapItem caveGate	= new MapItemGate(plainId, x, y);
		caveSection.draw(4, 3, caveGate);
		caveSection.drawEnd();
		
		
		MapItem gate		= new MapItemGate(cavePlainId, 4, 3);
		section.draw(x, y, gate);
		section.drawEnd();
	}
	
	
	/* ======================================= MISC ============================================= */
	
	public String createSectionKey(String plainId, int x, int y) {
		int secX = x>=0 ? x / SECTION_SIZE : ~(~x / SECTION_SIZE);
		int secY = y>=0 ? y / SECTION_SIZE : ~(~y / SECTION_SIZE);
		return plainId + "#" + secX + "#" + secY;
	}
	
	public Section sectionGet(String key) {
		Section section = sections.get(key);
		if (section != null) {
			return section;
		}
		String plainId = getPlainIdOfKey(key);
		Plain plain = plains.get(plainId);
		if (plain == null)
			return null;
			
		plain.checkSectionKey(key);
		
		
		section = new Section(this, plain, key);
		sections.put(key, section);
		section.load();
		return section;
	}
	
	public String getPlainIdOfKey(String key) {
		String[] keyparts = key.split("#");
		return keyparts[0];
	}
	
	
	/* ======================================= CASSANDRA ============================================= */
	public void savePlain(Plain plain) {
		JsonObject req = new JsonObject();
		req.putString("action", "prepared");
		req.putString("statement", "INSERT INTO maze.plains (plainid, info) VALUES (?, ?)");
		JsonArray v0 = new JsonArray();
		v0.addString(plain.getPlainId());
		v0.addObject(plain.getData());
		JsonArray values = new JsonArray();
		values.addArray(v0);
		req.putArray("values", values);
		
		
		eventBus.send("cassandra", req, new Handler<Message<JsonObject>>() {
			public void handle(Message<JsonObject> message) {	
				System.out.println("Cassandra reply " + message.body());
			}
		});
	}
	
	public void saveSection(Section section) {
		JsonObject req = new JsonObject();
		req.putString("action", "prepared");
		req.putString("statement", "INSERT INTO maze.sections (key, map, plainId) VALUES (?, ?, ?)");
		JsonArray v0 = new JsonArray();
		v0.addString(section.getKey());
		v0.addString(section.getJson(true, false).toString());
		v0.addString(section.plain.getPlainId());
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
	
	public void loadPlains() {
		JsonObject req = new JsonObject();
		req.putString("action", "raw");
		req.putString("statement", "SELECT * FROM maze.plains");
		
		
		eventBus.send("cassandra", req, new Handler<Message<JsonArray>>() {
			public void handle(Message<JsonArray> message) {
				System.out.println("Cassandra reply " + message.body());
				for (int i = 0; i < message.body().size(); i++) {
					JsonObject jrow = message.body().get(i);
					String plainId = jrow.getString("plainid");
					JsonObject jinfo = jrow.getObject("info");
					Plain newPlain = new Plain(plainId);
					newPlain.setData(jinfo);
					plains.put(plainId, newPlain);
				} 
			}
		});
	}
}