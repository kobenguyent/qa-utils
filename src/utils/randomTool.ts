import { searchData, SearchItem } from './searchData';

/**
 * Get a random tool from the available tools
 * Excludes the Home page from the random selection
 */
export const getRandomTool = (): SearchItem => {
  // Filter out Home page
  const tools = searchData.filter(item => item.path !== '#/');
  
  // Handle edge case where no tools are available
  if (tools.length === 0) {
    throw new Error('No tools available for random selection');
  }
  
  // Get random index
  const randomIndex = Math.floor(Math.random() * tools.length);
  
  return tools[randomIndex];
};
