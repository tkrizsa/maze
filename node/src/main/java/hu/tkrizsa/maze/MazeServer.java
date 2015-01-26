package hu.tkrizsa.maze;

import org.vertx.java.platform.Verticle;
import org.vertx.java.core.eventbus.EventBus;
import hu.tkrizsa.maze.util.SimpleFlake;
import hu.tkrizsa.maze.util.IdGenerator;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;


public class MazeServer extends Verticle {

	public int SECTION_SIZE = 16;
	private final SimpleFlake keygen = new SimpleFlake();
	private final IdGenerator md5gen = new IdGenerator();
	private String worldId;
	
	
	@Override
	public void start() {
		final JsonObject appConfig = container.config();
		worldId = appConfig.getString("worldId");
		if (worldId == null || "".equals(worldId)) {
			System.err.println("MISSING WORLDID!!!!");
		}
	}
	
	
	public EventBus getEventBus() {
		return vertx.eventBus();		
	}
	
	public String getWorldId() {
		return worldId;
	}

	public String createSectionKey(String plainId, int x, int y) {
		int secX = x>=0 ? x / SECTION_SIZE : ~(~x / SECTION_SIZE);
		int secY = y>=0 ? y / SECTION_SIZE : ~(~y / SECTION_SIZE);
		return plainId + "#" + secX + "#" + secY;
	}

	public String getPlainIdOfKey(String key) {
		String[] keyparts = key.split("#");
		return keyparts[0];
	}

	public String getMapServerId(String sectionKey) {
		String[] parts = sectionKey.split("#");
		if (parts.length != 3)
			return null;
		int secX = Integer.parseInt(parts[1]);
		if (secX>=0) {
			return "map00";
		} else {
			return "map01";
		}
	}
	
	public String getMapServerId(String plainId, int tileX, int tileY) {
		int secX = tileX>=0 ? tileX / SECTION_SIZE : ~(~tileX / SECTION_SIZE);
		if (secX>=0) {
			return "map00";
		} else {
			return "map01";
		}
	}

	public String getObjectServerId(String objectId) {
		return "obj00";
	}
	
	public String generateId() {
		return new Long(keygen.generate()).toString();
	}
	
	public String generateMd5Id() {
		return md5gen.generateId(32);
	}
	

}