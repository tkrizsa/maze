package hu.tkrizsa.maze;

import org.vertx.java.core.sockjs.SockJSSocket;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.buffer.Buffer;

import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;

public class Client {

	protected SockJSSocket clientSocket;
	protected GameServer game;
	protected String playerId;

	protected Map<String, Section> sections = new HashMap<String, Section>();
	protected Section playerSection;
	protected int playerX;
	protected int playerY;
	
	public Client(GameServer game, SockJSSocket clientSocket) {
		this.game = game;
		this.clientSocket = clientSocket;
	
		game.clientConnected(this);
	}
	
	public String getKey() {
		return this.clientSocket.remoteAddress().toString();
	}
	
	public void write(JsonObject jobj) {
		Buffer buff = new Buffer();
		buff.appendString(jobj.toString());
		clientSocket.write(buff);
	}
	
	public void error(String error) {
		JsonObject jobj = new JsonObject();
		jobj.putString("error", error);
		write(jobj);
	}
	
	public void remove() {
		for (Section section : sections.values()) {
			section.clientRemove(this);
		}
		sections = null;
		if (playerSection != null) {
			playerSection.removePlayer(this);
			playerSection = null;
		
		}
	
	}
	
	
	// PLAYER
	public void setPlayer(Section section, int x, int y) {
		if (section != playerSection) {
			if (playerSection != null) {
				playerSection.removePlayer(this);
			}
			playerSection = section;
			playerSection.addPlayer(this);
		} else {
			if (playerX != x || playerY != y) {
				playerX = x;
				playerY = y;
				playerSection.clientReplyMap();
			}
		}
	}
	
	public void removePlayer() {
		if (playerSection != null)
			playerSection.removePlayer(this);
		playerSection = null;
		playerX = 0;
		playerY = 0;
	}
	
	public int getPlayerX() {
		return playerX;
	}
	
	public int getPlayerY() {
		return playerY;
	}
	
	public String getPlayerId() {
		return playerId;
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
				section.clientRemove(this);
			}
		
		}
	
	}

}