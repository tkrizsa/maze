package hu.tkrizsa.maze.player;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;
import java.util.List;
import java.util.ArrayList;


public class GameObjectBuilding extends GameObject {

	private String plainId;
	private int tileX;
	private int tileY;
	private int tileWidth;
	private int tileHeight;
	private int tileOffX;
	private int tileOffY;
	
	
	public GameObjectBuilding(PlayerServer server, String plainId, int tileX, int tileY, int tileWidth, int tileHeight, int tileOffX, int tileOffY) {
		super(server);
		
		this.plainId 		= plainId;
		this.tileX 			= tileX;
		this.tileY 			= tileY;
		this.tileWidth 		= tileWidth;
		this.tileHeight 	= tileHeight;
		this.tileOffX 		= tileOffX;
		this.tileOffY 		= tileOffY;
	}

	@Override
	public JsonObject getData() {
		JsonObject jdata = super.getData();
		jdata.putString("plainId"		, plainId);
		jdata.putNumber("tileX"			, tileX);
		jdata.putNumber("tileY"			, tileY);
		jdata.putNumber("tileWidth"		, tileWidth);
		jdata.putNumber("tileHeight"	, tileHeight);
		jdata.putNumber("tileOffX"		, tileOffX);
		jdata.putNumber("tileOffY"		, tileOffY);
		return jdata;
	}
	

}


