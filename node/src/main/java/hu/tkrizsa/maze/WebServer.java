package hu.tkrizsa.maze;

import org.vertx.mods.web.WebServerBase;
import org.vertx.java.core.http.RouteMatcher;

public class WebServer extends WebServerBase {

 @Override
 protected RouteMatcher routeMatcher() {
  RouteMatcher matcher = new RouteMatcher();
  //matcher.post("/post", new MyOwnRequestHandler());

  matcher.noMatch(staticHandler());
  return matcher;
 }

}