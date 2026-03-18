// Debug script to test delete functionality
console.log('=== DELETE POST DEBUG ===');

// Test 1: Check if user is authenticated
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// Test 2: Check user data
const userData = localStorage.getItem('user');
console.log('User data:', userData ? 'exists' : 'missing');

if (userData) {
  const user = JSON.parse(userData);
  console.log('User ID:', user._id);
  console.log('User role:', user.role);
}

// Test 3: Check API call
const testDelete = async () => {
  try {
    const postId = 'YOUR_POST_ID_HERE'; // Replace with actual post ID
    console.log('Attempting to delete post:', postId);
    
    const response = await fetch(`/api/lost-found/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', await response.json());
    
  } catch (error) {
    console.error('Delete error:', error);
  }
};

// Uncomment to test
// testDelete();
