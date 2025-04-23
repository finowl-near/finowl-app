import { useState } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const UserList = () => {
  const { signedAccountId, viewFunction, callFunction, modal, signIn } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  const handleListAllUsers = async () => {
    if (!signedAccountId) {
      console.log('Please connect your wallet first');
      if (modal) {
        modal.show();
      } else if (signIn) {
        signIn();
      }
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to list all users...');
      
      // Try with view method first
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "list_all_users",
          args: {}
        });
        
        console.log('List all users result (view method):', result);
        setUserList(result);
        setShowUserList(true);
      } catch (viewError) {
        console.log('View method failed for list_all_users:', viewError);
        
        // Try with view_js_func as fallback
        try {
          const result = await viewFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "view_js_func",
            args: {
              function_name: "list_all_users"
            }
          });
          
          console.log('List all users result (view_js_func):', result);
          setUserList(result);
          setShowUserList(true);
        } catch (viewJsError) {
          console.log('view_js_func method also failed:', viewJsError);
          
          // Last resort: Try call method (which might require signing)
          const result = await callFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "call_js_func",
            args: {
              function_name: "list_all_users"
            }
          });
          
          console.log('List all users result (call method):', result);
          setUserList(result);
          setShowUserList(true);
        }
      }
    } catch (error) {
      console.error('Error listing all users:', error);
      alert('Failed to list users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">User Management</h2>
      <p className="panel-description">
        View all registered users on the Finowl platform.
      </p>
      <button 
        className="primary-button full-width"
        onClick={handleListAllUsers}
        disabled={loading}
      >
        {loading ? 'Loading Users...' : '👥 List All Users'}
      </button>

      {/* User List Modal */}
      {showUserList && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Registered Users</h2>
              <button 
                className="modal-close-button"
                onClick={() => setShowUserList(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {userList.length > 0 ? (
                <div className="user-list">
                  <p className="user-list-intro">Found {userList.length} registered users:</p>
                  <ul className="user-account-list">
                    {userList.map((user, index) => (
                      <li key={index} className="user-item">
                        <span className="user-account-id">{user}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👤</div>
                  <p>No registered users found.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => setShowUserList(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList; 