/**
 * Quicksort Algorithm Implementation in JavaScript
 * 
 * Quicksort is a divide-and-conquer algorithm that sorts an array by selecting
 * a 'pivot' element and partitioning the other elements into two sub-arrays
 * according to whether they are less than or greater than the pivot.
 * 
 * Time Complexity:
 * - Best Case: O(n log n)
 * - Average Case: O(n log n)
 * - Worst Case: O(n²)
 * 
 * Space Complexity: O(log n) due to the recursion stack
 */

/**
 * Main quicksort function
 * @param {Array} arr - The array to be sorted
 * @param {number} left - Starting index (default: 0)
 * @param {number} right - Ending index (default: arr.length - 1)
 * @returns {Array} The sorted array
 */
function quickSort(arr, left = 0, right = arr.length - 1) {
    // Create a copy to avoid mutating the original array
    if (left === 0 && right === arr.length - 1) {
        arr = [...arr];
    }
    
    // Base case: if the array has 1 or no elements, it's already sorted
    if (left < right) {
        // Find the partition index
        const pivotIndex = partition(arr, left, right);
        
        // Recursively sort elements before and after partition
        quickSort(arr, left, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, right);
    }
    
    return arr;
}

/**
 * Partition function using Lomuto partition scheme
 * @param {Array} arr - The array to partition
 * @param {number} left - Starting index
 * @param {number} right - Ending index
 * @returns {number} The index of the pivot after partition
 */
function partition(arr, left, right) {
    // Choose the rightmost element as pivot
    const pivot = arr[right];
    
    // Index of smaller element - indicates the right position
    // of pivot found so far
    let i = left - 1;
    
    // Traverse through the array
    for (let j = left; j < right; j++) {
        // If current element is smaller than or equal to pivot
        if (arr[j] <= pivot) {
            i++;
            // Swap elements at i and j
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    // Swap the pivot element with the element at i + 1
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    
    return i + 1;
}

/**
 * Alternative implementation with random pivot selection
 * This helps avoid worst-case performance on already sorted arrays
 */
function quickSortRandomPivot(arr, left = 0, right = arr.length - 1) {
    // Create a copy to avoid mutating the original array
    if (left === 0 && right === arr.length - 1) {
        arr = [...arr];
    }
    
    if (left < right) {
        // Choose a random pivot and swap it with the last element
        const randomIndex = Math.floor(Math.random() * (right - left + 1)) + left;
        [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];
        
        const pivotIndex = partition(arr, left, right);
        quickSortRandomPivot(arr, left, pivotIndex - 1);
        quickSortRandomPivot(arr, pivotIndex + 1, right);
    }
    
    return arr;
}

/**
 * In-place quicksort (modifies the original array)
 */
function quickSortInPlace(arr, left = 0, right = arr.length - 1) {
    if (left < right) {
        const pivotIndex = partition(arr, left, right);
        quickSortInPlace(arr, left, pivotIndex - 1);
        quickSortInPlace(arr, pivotIndex + 1, right);
    }
    return arr;
}

// Example usage and demonstrations
console.log('=== Quicksort Algorithm Examples ===\n');

// Example 1: Basic usage
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('Original array:', numbers);
console.log('Sorted array:', quickSort(numbers));
console.log('Original unchanged:', numbers);

// Example 2: Already sorted array (worst case for basic quicksort)
const sorted = [1, 2, 3, 4, 5, 6, 7, 8];
console.log('\nAlready sorted array:', sorted);
console.log('With regular quicksort:', quickSort(sorted));
console.log('With random pivot:', quickSortRandomPivot(sorted));

// Example 3: Array with duplicates
const duplicates = [5, 2, 8, 2, 9, 1, 5, 5];
console.log('\nArray with duplicates:', duplicates);
console.log('Sorted:', quickSort(duplicates));

// Example 4: Edge cases
console.log('\nEdge cases:');
console.log('Empty array:', quickSort([]));
console.log('Single element:', quickSort([42]));
console.log('Two elements:', quickSort([2, 1]));

// Example 5: In-place sorting
const inPlaceArray = [3, 7, 1, 4, 6, 2, 5];
console.log('\nIn-place sorting:');
console.log('Before:', [...inPlaceArray]);
quickSortInPlace(inPlaceArray);
console.log('After:', inPlaceArray);

// Performance comparison function
function comparePerformance(size = 10000) {
    console.log(`\n=== Performance Test (${size} elements) ===`);
    
    // Generate random array
    const randomArray = Array.from({ length: size }, () => 
        Math.floor(Math.random() * size)
    );
    
    // Test regular quicksort
    const arr1 = [...randomArray];
    const start1 = Date.now();
    quickSort(arr1);
    const time1 = Date.now() - start1;
    
    // Test random pivot quicksort
    const arr2 = [...randomArray];
    const start2 = Date.now();
    quickSortRandomPivot(arr2);
    const time2 = Date.now() - start2;
    
    console.log(`Regular quicksort: ${time1}ms`);
    console.log(`Random pivot quicksort: ${time2}ms`);
}

// Run performance test
comparePerformance(10000);

// Export functions for use in other modules
export {
    quickSort,
    quickSortRandomPivot,
    quickSortInPlace,
    partition
}; 