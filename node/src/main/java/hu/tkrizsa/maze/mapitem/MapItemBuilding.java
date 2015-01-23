package hu.tkrizsa.maze.mapitem;

import org.vertx.java.core.json.JsonObject;
import hu.tkrizsa.maze.GameServer;
import hu.tkrizsa.maze.Section;
import hu.tkrizsa.maze.util.SectionMap;

public class MapItemBuilding extends MapItemUniq {


	public MapItemBuilding(String className, GameServer server) {
		super(className, server);
	}

	
	
	public void placeTo(JsonObject jdata) throws Exception {
		System.out.println(jdata.toString());
		String plainId = jdata.getString("plainId");
		int tileX 			= jdata.getInteger("tileX");
		int tileY 			= jdata.getInteger("tileY");
		int tileWidth 		= jdata.getInteger("tileWidth");
		int tileHeight 		= jdata.getInteger("tileHeight");
		int tileOffY 		= jdata.getInteger("tileOffX");
		int tileOffX 		= jdata.getInteger("tileOffY");
		
		SectionMap secs = new SectionMap();
		
		// round 1 check if all the sections exists here and are loaded
		// to do! what happend if a section are in an other server?????!!!
		for (int y = tileY + tileOffY; y < tileY + tileOffY + tileHeight; y ++) {
			for (int x = tileX + tileOffX; x < tileX + tileOffX + tileWidth; x ++) {
				String sectionKey = getServer().createSectionKey(plainId, x, y);
				if (secs.containsKey(sectionKey))
					continue;
					
				Section section = getServer().sectionGetExisting(sectionKey);
				if (section == null || !section.isLoaded()) {
					throw new Exception("Missing section! " + (sectionKey==null?"[null]":sectionKey));
				}
				secs.put(section);
			}
		}
		
		// round 2 place it
		for (int y = tileY + tileOffY; y < tileY + tileOffY + tileHeight; y ++) {
			for (int x = tileX + tileOffX; x < tileX + tileOffX + tileWidth; x ++) {
				String sectionKey = getServer().createSectionKey(plainId, x, y);
				Section section = secs.get(sectionKey);
				section.draw(x, y, this);
			}
		}
			
		for (Section section : secs.values()) {
			section.drawEnd();
		}
		
		//throw new Exception("Not yet implemented.");
	}
	
	
	public JsonObject getMapData() {
		JsonObject data = new JsonObject();
		// data.putString("plainId", this.targetPlainId);
		// data.putNumber("x", this.targetX);
		// data.putNumber("y", this.targetY);
		return data;
	}
	
	public void setMapData(JsonObject data) {
		// this.targetPlainId = data.getString("plainId");
		// this.targetX = data.getInteger("x");
		// this.targetY = data.getInteger("y");
	}


}
