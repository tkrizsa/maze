package hu.tkrizsa.maze.player;


public class Farm extends GameObjectBuilding {

	public Farm(PlayerServer server, String plainId, int tileX, int tileY) {
		super(server, plainId, tileX, tileY, 5, 5, -2, -4);
	}

}