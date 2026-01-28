import { searchData, SearchItem } from './searchData';

/**
 * Get a random tool from the available tools
 * Excludes the Home page from the random selection
 */
export const getRandomTool = (): SearchItem => {
  // Filter out Home page
  const tools = searchData.filter(item => item.path !== '#/');
  
  // Get random index
  const randomIndex = Math.floor(Math.random() * tools.length);
  
  return tools[randomIndex];
};
