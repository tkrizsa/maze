package hu.tkrizsa.maze.mapitem;

import org.vertx.java.core.json.JsonObject;
import hu.tkrizsa.maze.mapserver.MapServer;
import hu.tkrizsa.maze.mapserver.Section;
import hu.tkrizsa.maze.mapserver.SectionMap;

public class MapItemBuilding extends MapItemUniq {


	private String plainId;
	private int tileX;
	private int tileY;
	private int tileWidth;
	private int tileHeight;
	private int tileOffY;
	private int tileOffX;

	public MapItemBuilding(String className, MapServer server) {
		super(className, server);
	}

	
	
	public void placeTo(JsonObject jdata) throws Exception {
		System.out.println(jdata.toString());
		setData(jdata);
		
		System.out.println("=========drawstart");
		System.out.println("=========tileOffX:" + tileOffX);
		System.out.println("=========tileOffY:" + tileOffY);
		
		SectionMap secs = new SectionMap();
		
		// round 1 check if all the sections exists here and are loaded
		for (int y = tileY + tileOffY; y < tileY + tileOffY + tileHeight; y ++) {
			for (int x = tileX + tileOffX; x < tileX + tileOffX + tileWidth; x ++) {
				String sectionKey = getServer().createSectionKey(plainId, x, y);
				
				// skip, if other server 
				if (!(getServer().getMapServerId(sectionKey).equals(getServer().getServerId())))
					continue;
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
				if (!(getServer().getMapServerId(sectionKey).equals(getServer().getServerId())))
					continue;
				
				Section section = secs.get(sectionKey);
				System.out.println("========draw " + this.getKey() + "; " + x + "; " + y + "; " + sectionKey);
				section.draw(x, y, this);
			}
		}
			
		for (Section section : secs.values()) {
			section.addUniq(this);
			section.drawEnd();
		}
		
		//throw new Exception("Not yet implemented.");
	}
	
	
	public JsonObject getMapData() {
		JsonObject jdata = super.getMapData();
		jdata.putString("plainId"	, plainId);
		jdata.putNumber("tileX"		, tileX);
		jdata.putNumber("tileY"		, tileY);
		jdata.putNumber("tileWidth"	, tileWidth);
		jdata.putNumber("tileHeight", tileHeight);
		jdata.putNumber("tileOffX"	, tileOffX);
		jdata.putNumber("tileOffY"	, tileOffY);
		return jdata;
	}
	
	public void setMapData(JsonObject data) {
		// this.targetPlainId = data.getString("plainId");
		// this.targetX = data.getInteger("x");
		// this.targetY = data.getInteger("y");
	}
	
	@Override
	public void setData(JsonObject jdata) {
		super.setData(jdata);
		plainId 		= jdata.getString("plainId");
		tileX 			= jdata.getInteger("tileX");
		tileY 			= jdata.getInteger("tileY");
		tileWidth 		= jdata.getInteger("tileWidth");
		tileHeight 		= jdata.getInteger("tileHeight");
		tileOffX 		= jdata.getInteger("tileOffX");
		tileOffY 		= jdata.getInteger("tileOffY");
	}


}
