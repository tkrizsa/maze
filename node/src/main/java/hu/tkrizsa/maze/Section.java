package hu.tkrizsa.maze;

import java.util.List;
import java.util.LinkedList;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;

import hu.tkrizsa.maze.mapitem.*;

public class Section {

	public String key;
	public GameServer game;
	public Plain plain;
	private String plainId;
	private int offX;
	private int offY;
	final Map<String, Client> subscribers = new HashMap<String, Client>();
	private boolean loaded = false;
	
	private List<List<MapItem>> items;
	private Map<String, SectionPlayer> players = new HashMap<String, SectionPlayer>();
	private Map<String, PlayerPos> awayPlayers = new HashMap<String, PlayerPos>();
	

	public Section(GameServer game, Plain plain, String key) {
		String[] keyparts = key.split("#");
		try {
			plainId = keyparts[0];
			offX = Integer.parseInt(keyparts[1]) * game.SECTION_SIZE;  
			offY = Integer.parseInt(keyparts[2]) * game.SECTION_SIZE;
		} catch(NumberFormatException nfe) {  
			System.err.println("Invalid section key" + key);  
		}  		
	
		// System.out.println("Section created : " + key);
		// System.out.println("off : " + offX + ", " + offY);
		this.game = game;
		this.key = key;
		this.plain = plain;

		items = new ArrayList<List<MapItem>>(GameServer.SECTION_SIZE * GameServer.SECTION_SIZE);

	}
	
	public String getKey() {
		return key;
	}
	

	// player
	

	public void addPlayer(Client client) {
		players.put(client.getKey(), new SectionPlayer(client));
		awayPlayers.remove(client.playerId);
		subscribersNotify();
	}
	
	public void addPlayer(Client client, String fromKey, int fromX, int fromY) {
		players.put(client.getKey(), new SectionPlayer(client, fromKey, fromX, fromY));
		awayPlayers.remove(client.playerId);
		subscribersNotify();
	}
	
	public void removePlayer(Client client, PlayerPos where) {
		this.players.remove(client.getKey());
		awayPlayers.put(client.getPlayerId(), where);
		subscribersNotify();
	}
	
	// call this when client disconnects
	public void disconnectPlayer(Client client) {
		game.awayPlayers.put(client.getPlayerId(), getKey());
		removePlayer(client, new PlayerPos());
	}
	
	public void removeAway(String playerId) {
		awayPlayers.remove(playerId);
	}
		
	
	
	// subscriptions 
	public void subscriberAdd(Client client) {
		subscribers.put(client.getKey(), client);
	}
	
	public void subscriberRemove(Client client) {
		subscribers.remove(client.getKey());
	}
	
	public void subscribersNotify() {
		subscribersNotify(false);
	}
	
	public void subscribersNotify(boolean mapChanged) {
		// System.out.println("-> subscribersNotify");

		JsonObject jresp = new JsonObject();
		jresp.putString("cmd", "init");
		JsonObject jresp_sections = new JsonObject();
		jresp.putObject("sections", jresp_sections);
		jresp_sections.putObject(getKey(), getJson(false, mapChanged));
		for (Client client : subscribers.values()) {
//			System.out.println("-> client write");
			client.write(jresp);
		}
	
	}

	
	public boolean isLoaded() {
		return loaded;
	}

	public void setLoaded(boolean value) {
		loaded = value;
	
		if (loaded)
			subscribersNotify(true);
	}
	
	
	
	/* ======================================== DRAW ======================================== */
	
	public void draw(int x, int y, MapItem item) {
		int secX = x - offX;
		int secY = y - offY;
		int pos = secY * game.SECTION_SIZE + secX;
		
		// System.out.println("x : " + x);
		// System.out.println("y : " + y);
		// System.out.println("offX : " + offX);
		// System.out.println("offY : " + offY);
		// System.out.println("secX : " + secX);
		// System.out.println("secY : " + secY);
		// System.out.println("pos : " + pos);
		
		List<MapItem> ll = items.get(pos);
		
		if (item instanceof MapItemFloor) {
			Iterator<MapItem> it = ll.iterator();
			while(it.hasNext()) {
				MapItem xitem = it.next();
				if (xitem instanceof MapItemFloor) {
					it.remove();
				}
			}
			ll.add(0, item);
		} else {
			ll.add(item);
		}
		
	}
	
	public void drawEnd() {
		subscribersNotify(true);
		save();
	}
	
	/* ===================================== LOAD / SAVE ======================================== */
	public void load() {
		game.loadSection(this);
	}
	
	public void save() {
		game.saveSection(this);
	}
	
	
	// called when loaded, but section not exists in cassandra
	protected void notExists() {
		MapItem FLOOR = game.getSingle(plain.getDefaultFloor());
		MapItem NOTHING = game.getSingle("Nothing");
	
		items = new ArrayList<List<MapItem>>(GameServer.SECTION_SIZE * GameServer.SECTION_SIZE);
		for (int y = 0; y < GameServer.SECTION_SIZE; y++) {
			for (int x = 0; x < GameServer.SECTION_SIZE; x++) {
				List<MapItem> ll = new LinkedList<MapItem>();
				if (y+offY>=plain.getTop() && y+offY <= plain.getBottom() && x+offX>= plain.getLeft() && x+offX<= plain.getRight()) {
					ll.add(FLOOR);
				} else {
					ll.add(NOTHING);
				}
				items.add(ll);
			}
		}
		
		setLoaded(true);
		save();
	}
	
	// called back when loaded from cassandra
	protected void loaded(JsonObject jdata) {
		items = new ArrayList<List<MapItem>>(GameServer.SECTION_SIZE * GameServer.SECTION_SIZE);
		
		
		
		JsonArray jobjects = jdata.getArray("objects");
		List<String> classNames = new ArrayList<String>(jobjects.size());
		for (int i = 0; i < jobjects.size(); i++) {
			classNames.add((String)jobjects.get(i));
		}
		JsonArray jitems = jdata.getArray("items");
		for (int i = 0; i < jitems.size(); i++) {
			LinkedList<MapItem> ll = new LinkedList<MapItem>();
			items.add(ll);
			
			JsonArray jlist = (JsonArray)jitems.get(i);
			for (int j = 0; j < jlist.size(); j++) {
				Object omidata = jlist.get(j);
				int classIndex = -1;
				JsonObject jmidata = null;
				if (omidata instanceof JsonObject) {
					jmidata = (JsonObject)omidata;
					classIndex = jmidata.getInteger("_ix");
					
				} else {
					classIndex = (int)omidata;
				}
				
				String className = classNames.get(classIndex);
				MapItem obj = game.getMapItem(className);
				if (jmidata != null) {
					obj.setMapData(jmidata);
				}
				ll.add(obj);
			}
			
			
		}
		
		setLoaded(true);
	}
	
	
	public JsonObject getJson(boolean forDB, boolean mapChanged) {
	
		JsonObject jres = new JsonObject();
		
		if (forDB || mapChanged) {
			Map<String,Integer> objects = new HashMap<String, Integer>();
			JsonArray jobjects = new JsonArray();
			
			JsonArray jitems = new JsonArray();
			
			for (List<MapItem> ll : items) {
				JsonArray jmapitem = new JsonArray();
				for (MapItem mi : ll) {
					Integer index = objects.get(mi.getClassName());
					if (index == null) {
						jobjects.addString(mi.getClassName());
						objects.put(mi.getClassName(), jobjects.size()-1);
						index = jobjects.size()-1;
					}
					JsonObject jmidata = mi.getMapData();
					if (jmidata == null) {
						jmapitem.addNumber(index);
					} else {
						jmidata.putNumber("_ix", index);
						jmapitem.addObject(jmidata);
					}
				}
				jitems.addArray(jmapitem);
			}
			
			
			jres.putArray("objects", jobjects);
			jres.putArray("items", jitems);
		}
		
		if (!forDB) {
			JsonArray jplayers = new JsonArray();
			for(SectionPlayer sectionPlayer : players.values()) {
				JsonObject jplayer = new JsonObject();
				jplayer.putString("id", sectionPlayer.getClient().getPlayerId());
				jplayer.putString("name", sectionPlayer.getClient().playerName);
				jplayer.putNumber("x", 	sectionPlayer.getClient().getPlayerX());
				jplayer.putNumber("y", 	sectionPlayer.getClient().getPlayerY());
				if (sectionPlayer.getFromKey() != null) {
					jplayer.putString("fromKey", sectionPlayer.getFromKey());
					jplayer.putNumber("fromX", sectionPlayer.getFromX());
					jplayer.putNumber("fromY", sectionPlayer.getFromY());
				}
				jplayers.addObject(jplayer);
			}
			jres.putArray("players", jplayers);
		
			JsonArray jaway = new JsonArray();
			for (Iterator<Map.Entry<String, PlayerPos>> it = awayPlayers.entrySet().iterator(); it.hasNext(); ) {
				Map.Entry<String, PlayerPos> entry = it.next();
				if (System.currentTimeMillis() > entry.getValue().when + 1000*60) {
					game.awayPlayers.remove(entry.getKey());
					it.remove();
					continue;
				}
				JsonObject jaw = new JsonObject();
				jaw.putString("id", entry.getKey());
				jaw.putString("key", entry.getValue().key);
				jaw.putNumber("x", entry.getValue().x);
				jaw.putNumber("y", entry.getValue().y);
				jaway.addObject(jaw);
			}
			jres.putArray("away", jaway);
		}
		
		
		return jres;
	}

}