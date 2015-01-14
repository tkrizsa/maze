package hu.tkrizsa.maze;

import org.vertx.java.core.sockjs.SockJSSocket;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.buffer.Buffer;

import java.util.Map;
import java.util.HashMap;

public class Client {

	protected SockJSSocket clientSocket;
	protected GameServer game;
	protected String playerId;
	protected int posX;
	protected int posY;
	protected Map<String, Section> sections = new HashMap<String, Section>();
	
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
	
	public void setPos(int x, int y) {
		posX = x;
		posY = y;
	}
	
	public void sectionAdd(Section section) {
		sections.put(section.getKey(), section);
	}

}