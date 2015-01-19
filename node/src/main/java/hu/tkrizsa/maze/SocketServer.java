package hu.tkrizsa.maze;


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

public class SocketServer extends Verticle {

	@Override
	public void start() {
		final Logger logger = container.logger();
		final EventBus eventBus = vertx.eventBus();
		final GameServer game = new GameServer(eventBus);
		final JsonObject appConfig = container.config();
		System.out.println(appConfig.toString());
		
		HttpServer server = vertx.createHttpServer();

		server.requestHandler(new Handler<HttpServerRequest>() {
		  public void handle(HttpServerRequest req) {
			//if (req.path().equals("/")) req.response().sendFile("sockjs/index.html"); // Serve the html
		  }
		});

		SockJSServer sockServer = vertx.createSockJSServer(server);

		sockServer.installApp(new JsonObject().putString("prefix", "/testapp"), new Handler<SockJSSocket>() {
			public void handle(final SockJSSocket sock) {
				logger.info("socket created..");
				final Client client = new Client(game, sock);
				
			
				sock.dataHandler(new Handler<Buffer>() {
					public void handle(Buffer data) {
						logger.info("socket incoming data..");
						logger.info(data.toString());
						
						JsonObject msg;
						try {
							msg = new JsonObject(data.toString());
							
						} catch (Exception ex) {
							logger.error(ex.toString());
						
							return;
						}
						game.clientMessage(client, msg);
						
						
					}
				});
				
				sock.endHandler(new Handler<java.lang.Void> () {
					public void handle(java.lang.Void nothing) {
						logger.info("socket end..");
						game.clientRemove(client);
					}
				});

				sock.exceptionHandler(new Handler<java.lang.Throwable> () {
					public void handle(java.lang.Throwable ex) {
						logger.info("socket exception.." + ex.toString());
						game.clientRemove(client);
					}
				});
			}
		});
	
		server.listen(appConfig.getInteger("port"));	
	

	}
}