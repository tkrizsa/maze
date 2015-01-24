package hu.tkrizsa.maze;

import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.platform.Verticle;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.JsonArray;

 
 
public class NodeMain extends Verticle {
 
	@Override
	public void start() {
		final EventBus eventBus = vertx.eventBus();
		final Logger logger = container.logger();
		final JsonObject appConfig = container.config();
 
		logger.info("MAZE START...");
		logger.info(appConfig.toString());
		
		container.deployModule("com.insanitydesign~vertx-mod-cassandra-persistor~0.4.1", appConfig.getObject("cassandra"),  
			new AsyncResultHandler<String>() {
				public void handle(AsyncResult<String> asyncResult) {
					if (asyncResult.succeeded()) {
						JsonArray cfg_webservers = appConfig.getArray("webservers");
						if (cfg_webservers != null) {
							for (int i = 0; i < cfg_webservers.size(); i++) {
								container.deployVerticle("hu.tkrizsa.maze.WebServer", (JsonObject)cfg_webservers.get(i));
							}
						}
						
						JsonArray cfg_gameservers = appConfig.getArray("mapservers");
						if (cfg_gameservers != null) {
							for (int i = 0; i < cfg_gameservers.size(); i++) {
								container.deployVerticle("hu.tkrizsa.maze.mapserver.MapServer", (JsonObject)cfg_gameservers.get(i));
							}
						}
						
						JsonArray cfg_playerservers = appConfig.getArray("objectservers");
						if (cfg_playerservers != null) {
							for (int i = 0; i < cfg_playerservers.size(); i++) {
								container.deployVerticle("hu.tkrizsa.maze.player.PlayerServer", (JsonObject)cfg_playerservers.get(i));
							}
						}
						
						JsonArray cfg_clientservers = appConfig.getArray("clientservers");
						if (cfg_clientservers != null) {
							for (int i = 0; i < cfg_clientservers.size(); i++) {
								container.deployVerticle("hu.tkrizsa.maze.clientserver.ClientServer", (JsonObject)cfg_clientservers.get(i));
							}
						}
						
						
						
						
						
					} else {
						asyncResult.cause().printStackTrace();
					}
				}
		});
		
		
		
	
	}
}