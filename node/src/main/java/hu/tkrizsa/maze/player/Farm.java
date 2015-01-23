package hu.tkrizsa.maze.player;


public class Farm extends GameObjectBuilding {

	public Farm(PlayerServer server, String plainId, int tileX, int tileY) {
		super("Farm", server, plainId, tileX, tileY, 5, 5, -2, -4);
	}
	
	public Farm(PlayerServer server) {
		super("Farm", server);
	}
	
	

}