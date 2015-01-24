package hu.tkrizsa.maze.mapserver;

public class SectionPlayer {
	private Client client;
	private String fromKey;
	private int fromX;
	private int fromY;
	
	
	
	public SectionPlayer(Client client) {
		this.client = client;
	}
	
	public SectionPlayer(Client client, String fromKey, int fromX, int fromY) {
		this(client);
		this.fromKey = fromKey;
		this.fromX = fromX;
		this.fromY = fromY;
	}
	
	public Client getClient() {
		return client;
	}

	public String getFromKey() {
		return fromKey;
	}

	public int getFromX() {
		return fromX;
	}

	public int getFromY() {
		return fromY;
	}

}