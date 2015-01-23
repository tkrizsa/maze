package hu.tkrizsa.maze.util;

import hu.tkrizsa.maze.Section;

public class SectionMap extends SmallMap<String, Section> {
	public Section put(Section section) {
		return super.put(section.getKey(), section);
	}
}