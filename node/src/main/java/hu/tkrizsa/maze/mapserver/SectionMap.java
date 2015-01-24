package hu.tkrizsa.maze.mapserver;

import hu.tkrizsa.maze.util.SmallMap;

public class SectionMap extends SmallMap<String, Section> {
	public Section put(Section section) {
		return super.put(section.getKey(), section);
	}
}