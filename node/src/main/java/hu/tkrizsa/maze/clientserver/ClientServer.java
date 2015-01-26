package hu.tkrizsa.maze.clientserver;


import org.vertx.java.platform.Verticle;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.Message;

import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.sockjs.SockJSServer;
import org.vertx.java.core.sockjs.SockJSSocket;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;

import java.util.Map;
import java.util.HashMap;

import hu.tkrizsa.maze.util.SmallMap;
import hu.tkrizsa.maze.MazeServer;

public class ClientServer extends MazeServer {


	String clientServerId;
	final Map<String, SocketClient> clients = new HashMap<String, SocketClient>();
	
	private class SocketClient {
		public String playerId;
		public SockJSSocket sock;
		
		public SocketClient(SockJSSocket sock) {
			this.sock = sock;
		}
	}
	



	@Override
	public void start() {
		final Logger logger = container.logger();
		final EventBus eventBus = vertx.eventBus();
		final JsonObject appConfig = container.config();
		
		
		System.out.println("Clientserver starting....");
		System.out.println(appConfig.toString());
		
		clientServerId = appConfig.getString("serverId");



		eventBus.registerHandler("client#" + clientServerId, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> msg) {
				// System.out.println("CLIENT#"+clientServerId);
				// System.out.println(msg.body());
				String playerId = msg.body().getString("playerId");
				
				SocketClient socketclient = clients.get(playerId);
				if (socketclient == null) {
					System.out.println("CLIENT NOT FOUND IN ANSWER. PLAYERID : " + playerId);
					return;
				
				}
				Buffer buff = new Buffer();
				buff.appendString(msg.body().toString());
				
				socketclient.sock.write(buff);
			}
		});
		
		
		HttpServer server = vertx.createHttpServer();
		server.requestHandler(new Handler<HttpServerRequest>() {
		  public void handle(HttpServerRequest req) {
			//if (req.path().equals("/")) req.response().sendFile("sockjs/index.html"); // Serve the html
		  }
		});
		SockJSServer sockServer = vertx.createSockJSServer(server);

		sockServer.installApp(new JsonObject().putString("prefix", "/mazesocket"), new Handler<SockJSSocket>() {
			public void handle(final SockJSSocket sock) {
				//logger.info("socket created..");
				//String playerId = (new Long(keyGen.generate())).toString();
				
				final SocketClient socketclient = new SocketClient(sock);
				
			
				sock.dataHandler(new Handler<Buffer>() {
					public void handle(Buffer data) {
						// logger.info("socket incoming data..");
						// logger.info(data.toString());
						
						JsonObject msg;
						try {
							msg = new JsonObject(data.toString());

							System.out.println("** INCOMING");
							System.out.println("** current playerid : " + socketclient.playerId);
							if (socketclient.playerId == null) {
								socketclient.playerId = msg.getString("playerId");
								if (socketclient.playerId == null || "".equals(socketclient.playerId)) 
									throw new Exception("Missing playerid");
				
								clients.put(socketclient.playerId, socketclient);
								System.out.println("** playerid saved : " + socketclient.playerId);
							}


							
							String cmd = msg.getString("cmd");
							/* ================================================================ INIT ============================================================= */
							if ("init".equals(cmd)) {
								SmallMap<String, JsonObject> forwards = new SmallMap<String, JsonObject>();
								String serverId;
								
								/* ==================================== playerpos =================================== */
								JsonObject playerPos = msg.getObject("playerPos");
								if (playerPos != null) {
									serverId = getMapServerId(playerPos.getString("key"));
									JsonObject forward = forwards.get(serverId);
									if (forward == null) {
										forward = new JsonObject();
										forward.putString("cmd", "init");
										forward.putString("playerId", socketclient.playerId);
										forward.putString("clientServerAddress", "client#" + clientServerId);
										forwards.put(serverId, forward);
									}
									forward.putObject("playerPos", playerPos);
								}
								
								/* ==================================== subscribe =================================== */
								JsonArray sections = msg.getArray("subscribe");
								if (sections != null) {
									for (int i = 0; i < sections.size(); i++) {
										JsonObject section = sections.get(i);
										String sectionKey = section.getString("key");
										serverId = getMapServerId(sectionKey);
										JsonObject forward = forwards.get(serverId);
										if (forward == null) {
											forward = new JsonObject();
											forward.putString("cmd", "init");
											forward.putString("playerId", socketclient.playerId);
											forward.putString("clientServerAddress", "client#" + clientServerId);
											forwards.put(serverId, forward);
										}
										JsonArray fsubscribe = forward.getArray("subscribe");
										if (fsubscribe == null) {
											fsubscribe = new JsonArray();
											forward.putArray("subscribe", fsubscribe);
										}
										fsubscribe.addObject(section);
									}
								}
								
								/* ==================================== subscribe =================================== */
								JsonArray jobjectIds = msg.getArray("getObjects");
								if (jobjectIds != null) {
									for (int i = 0; i < jobjectIds.size(); i++) {
										String objectId = jobjectIds.get(i);
										serverId = getObjectServerId(objectId);
										JsonObject forward = forwards.get(serverId);
										if (forward == null) {
											forward = new JsonObject();
											forward.putString("cmd", "init");
											forward.putString("playerId", socketclient.playerId);
											forward.putString("clientServerAddress", "client#" + clientServerId);
											forwards.put(serverId, forward);
										}
										JsonArray fobjectIds = forward.getArray("getObjects");
										if (fobjectIds == null) {
											fobjectIds = new JsonArray();
											forward.putArray("getObjects", fobjectIds);
										}
										fobjectIds.addString(objectId);
									}
								}
								
								System.out.println("========================");
								System.out.println(forwards.toString());
								
								/* ==================================== messages read, send it to servers =================================== */
								for (Map.Entry<String, JsonObject> entry : forwards.entrySet()) {
									eventBus.send("traverse#" + entry.getKey(), entry.getValue());
								
								}
							/* ================================================================ DRAW ============================================================= */
							} else if ("draw".equals(cmd)) {
								SmallMap<String, JsonObject> forwards = new SmallMap<String, JsonObject>();
							
								JsonArray jitems = msg.getArray("items");
								for (int i = 0; i < jitems.size(); i++) {
									JsonObject jitem 	= jitems.get(i);
									String plainId 		= jitem.getString("plainId");
									int    tileX		= jitem.getInteger("tileX");
									int    tileY		= jitem.getInteger("tileY");
									String serverId 	= getMapServerId(plainId, tileX, tileY);
									JsonObject forward = forwards.get(serverId);
									if (forward == null) {
										forward = new JsonObject();
										forward.putString("cmd", "draw");
										forward.putString("playerId", socketclient.playerId);
										forward.putString("clientServerAddress", "client#" + clientServerId);
										forwards.put(serverId, forward);
									}
									JsonArray fitems = forward.getArray("items");
									if (fitems == null) {
										fitems = new JsonArray();
										forward.putArray("items", fitems);
									}
									fitems.addObject(jitem);
								}
								
								for (Map.Entry<String, JsonObject> entry : forwards.entrySet()) {
									System.out.println("send draw forward " + entry.getKey());
									System.out.println(entry.getValue());
									
									eventBus.send("draw#" + entry.getKey(), entry.getValue());
								}
								
							/* ================================================================ BUILD ============================================================= */
							} else if ("build".equals(cmd)) {
								String objectId = generateId();
								String serverId = getObjectServerId(objectId);
								msg.putString("clientServerAddress", "client#" + clientServerId);
								msg.putString("objectId", objectId);
								eventBus.send("build#" + serverId, msg);
							} else {
								logger.error("invalid cmd in client message.");
								return;
							}
							
						} catch (Exception ex) {
							logger.error(ex.toString());
							ex.printStackTrace();
							return;
						}
							
						
						
					}
				});
				
				sock.endHandler(new Handler<java.lang.Void> () {
					public void handle(java.lang.Void nothing) {
						logger.info("socket end..");
						if (socketclient.playerId != null) {
							clients.remove(socketclient.playerId);
							JsonObject jobj = new JsonObject();
							jobj.putString("playerId",socketclient.playerId);
							eventBus.publish("client.disconnected", jobj);
						}
					}
				});

				sock.exceptionHandler(new Handler<java.lang.Throwable> () {
					public void handle(java.lang.Throwable ex) {
						logger.info("socket exception.." + ex.toString());
						if (socketclient.playerId != null) {
							clients.remove(socketclient.playerId);
							JsonObject jobj = new JsonObject();
							jobj.putString("playerId", socketclient.playerId);
							eventBus.publish("client.disconnected", jobj);
						}
						sock.close();
					}
				});
			}
		});
	
		server.listen(appConfig.getInteger("port"));	
	

	}
}