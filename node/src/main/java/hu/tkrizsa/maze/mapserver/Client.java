package hu.tkrizsa.maze.mapserver;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.buffer.Buffer;

import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;

public class Client {

	protected MapServer game;
	protected String playerId;
	private String clientServerAddress;

	protected Map<String, Section> sections = new HashMap<String, Section>();
	protected Section playerSection;
	protected int playerX;
	protected int playerY;
	
	public String playerName = "!";
	
	public Client(MapServer game, String clientServerAddress, String playerId) {
		this.game = game;
		this.clientServerAddress = clientServerAddress;
		this.playerId = playerId;
		game.clientConnected(this);
	}
	
	public String getKey() {
		return playerId;
	}
	
	public void write(JsonObject jobj) {
		jobj.putString("playerId", this.playerId);
		game.busSend(clientServerAddress, jobj);
		System.out.println("CLIENT WRITE");
		System.out.println(jobj);
	}
	
	public void error(String error) {
		JsonObject jobj = new JsonObject();
		jobj.putString("error", error);
		write(jobj);
	}
	
	public void disconnected() {
		for (Section section : sections.values()) {
			section.subscriberRemove(this);
		}
		sections = null;
		disconnectedAsPlayer();
	}

	// called when still connected, but without playerPos = walks on other server
	// or from dissconnect
	public void disconnectedAsPlayer() {
		if (playerSection != null) {
			playerSection.disconnectPlayer(this);
			playerSection = null;
		}
	}
	
	
	
	// PLAYER
	public void setPlayer(Section section, int x, int y) {
		System.out.println("-> setplayer");
		if (section != playerSection) {
			if (playerSection != null) {
				playerSection.removePlayer(this, new PlayerPos(section.getKey(), x, y));
			}
			if (playerSection != null) {
				String fromKey = playerSection.getKey();
				int fromX = playerX;
				int fromY = playerY;
				playerSection = section;
				playerX = x;
				playerY = y;
				playerSection.addPlayer(this, fromKey, fromX, fromY);
			} else {
				playerSection = section;
				playerX = x;
				playerY = y;
				playerSection.addPlayer(this);
			}
		} else {
			if (playerX != x || playerY != y) {
				playerX = x;
				playerY = y;
				playerSection.subscribersNotify();
			}
		}
	}
	
	/*public void removePlayer() {
		if (playerSection != null)
			playerSection.removePlayer(this);
		playerSection = null;
		playerX = 0;
		playerY = 0;
	}*/
	
	public int getPlayerX() {
		return playerX;
	}
	
	public int getPlayerY() {
		return playerY;
	}
	
	public String getPlayerId() {
		return playerId;
	}
	
	public void setPlayerId(String playerId) {
		this.playerId = playerId;
	}
	
	
	// SECTION SUBSCRIPTIONS
	public void sectionAdd(Section section) {
		sections.put(section.getKey(), section);
	}
	
	public void sectionUnsubscribe(Map<String, Section> newSections) {
		Iterator<String> it = sections.keySet().iterator();
		while (it.hasNext()) {
			String key = it.next();
			if (newSections.get(key) == null) {
				Section section = sections.get(key);
				it.remove();
				section.subscriberRemove(this);
			}
		
		}
	
	}

}