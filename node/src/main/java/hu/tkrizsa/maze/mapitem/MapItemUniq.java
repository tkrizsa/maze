package hu.tkrizsa.maze.mapitem;

import hu.tkrizsa.maze.GameServer;

public class MapItemUniq extends MapItem {
	private GameServer server;
	private String key;
	
	public MapItemUniq(String className, GameServer server) {
		super(className);
		this.server = server;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getKey() {
		return key;
	}
	
	public GameServer getServer() {
		return server;
	}

}