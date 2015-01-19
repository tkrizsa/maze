package hu.tkrizsa.maze;

import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.platform.Verticle;

import org.vertx.java.core.json.JsonObject;

 
 
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
						container.deployVerticle("hu.tkrizsa.maze.WebServer", appConfig.getObject("webserver"));
						container.deployVerticle("hu.tkrizsa.maze.SocketServer", appConfig.getObject("gameserver"));
						
					} else {
						asyncResult.cause().printStackTrace();
					}
				}
		});
		
		
		
	
	}
}