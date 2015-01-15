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
	private int offX;
	private int offY;
	final Map<String, Client> clients = new HashMap<String, Client>();
	private boolean loaded = false;
	
	private List<List<MapItem>> items;
	private Map<String, Client> players = new HashMap<String, Client>();
	private Map<String, PlayerPos> awayPlayers = new HashMap<String, PlayerPos>();

	public Section(GameServer game, String key) {
		String[] keyparts = key.split("_");
		try {  
			offX = Integer.parseInt(keyparts[0]) * game.SECTION_SIZE;  
			offY = Integer.parseInt(keyparts[1]) * game.SECTION_SIZE;
		} catch(NumberFormatException nfe) {  
			System.err.println("Invalid section key" + key);  
		}  		
	
		System.out.println("Section created : " + key);
		System.out.println("off : " + offX + ", " + offY);
		this.game = game;
		this.key = key;

		items = new ArrayList<List<MapItem>>(GameServer.SECTION_SIZE * GameServer.SECTION_SIZE);

		load();		
	}
	
	public String getKey() {
		return key;
	}
	

	// player
	

	public void addPlayer(Client client) {
		players.put(client.getKey(), client);
		awayPlayers.remove(client.playerId);
		clientReplyMap();
	}
	
	public void removePlayer(Client client, PlayerPos where) {
		this.players.remove(client.getKey());
		awayPlayers.put(client.getPlayerId(), where);
		clientReplyMap();
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
	public void clientAdd(Client client) {
		clients.put(client.getKey(), client);
	}
	
	public void clientRemove(Client client) {
		clients.remove(client.getKey());
	}
	
	public void clientReplyMap() {
		clientReplyMap(false);
	}
	
	public void clientReplyMap(boolean mapChanged) {
		System.out.println("-> clientreplymap");

		JsonObject jresp = new JsonObject();
		jresp.putString("cmd", "init");
		JsonObject jresp_sections = new JsonObject();
		jresp.putObject("sections", jresp_sections);
		jresp_sections.putObject(getKey(), getJson(false, mapChanged));
		for (Client client : clients.values()) {
			System.out.println("-> client write");

			client.write(jresp);
		}
	
	}

	
	public boolean isLoaded() {
		return loaded;
	}

	public void setLoaded(boolean value) {
		loaded = value;
	
		if (loaded)
			clientReplyMap(true);
	}
	
	
	
	/* ======================================== DRAW ======================================== */
	
	public void draw(int x, int y, MapItem item) {
		int secX = x - offX;
		int secY = y - offY;
		int pos = secY * game.SECTION_SIZE + secX;
		
		System.out.println("x : " + x);
		System.out.println("y : " + y);
		System.out.println("offX : " + offX);
		System.out.println("offY : " + offY);
		System.out.println("secX : " + secX);
		System.out.println("secY : " + secY);
		System.out.println("pos : " + pos);
		
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
		
		clientReplyMap();
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
		MapItem GRASS = game.getSingle("GrassFloor");
	
		items = new ArrayList<List<MapItem>>(GameServer.SECTION_SIZE * GameServer.SECTION_SIZE);
		for (int i = 0; i < GameServer.SECTION_SIZE * GameServer.SECTION_SIZE; i++) {
			List<MapItem> ll = new LinkedList<MapItem>();
			ll.add(GRASS);
			items.add(ll);
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
				int classIndex = (int)jlist.get(j);
				String className = classNames.get(classIndex);
				
				MapItem obj = game.getSingle(className);
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
					jmapitem.addNumber(index);
				}
				jitems.addArray(jmapitem);
			}
			
			
			jres.putArray("objects", jobjects);
			jres.putArray("items", jitems);
		}
		
		if (!forDB) {
			JsonArray jplayers = new JsonArray();
			for(Client client : players.values()) {
				JsonObject jplayer = new JsonObject();
				jplayer.putString("id", client.getPlayerId());
				jplayer.putNumber("x", client.getPlayerX());
				jplayer.putNumber("y", client.getPlayerY());
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