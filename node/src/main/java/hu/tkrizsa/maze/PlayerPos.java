package hu.tkrizsa.maze;


public class PlayerPos {
	public String key;
	public int x;
	public int y;
	public long when;
	
	public PlayerPos() {
		this.when = System.currentTimeMillis();
	}
	
	public PlayerPos(String key, int x, int y) {
		this.key = key;
		this.x = x;
		this.y = y;
		this.when = System.currentTimeMillis();
	}
	
	public PlayerPos(Client client) {
		this.key = client.playerSection.getKey();
		this.x = client.playerX;
		this.y = client.playerY;
		this.when = System.currentTimeMillis();
	}
	
	
}