import css from 'styled-jsx/css';

export default css.global`
  /* Base styles */
  .main-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    gap: 30px;
    padding: 20px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    margin-bottom: 30px;
  }

  .section-title {
    font-size: 1.8rem;
    color: #90cdf4;
    margin: 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #4a5568;
  }

  .two-column-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    width: 100%;
  }

  .left-column, .right-column {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .panel-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
    width: 100%;
  }

  .panel {
    background-color: #2d3748;
    color: #ffffff;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .panel:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
  }

  .panel-title {
    color: #63b3ed;
    margin: 0 0 15px 0;
    font-size: 1.5rem;
    border-bottom: 1px solid #4a5568;
    padding-bottom: 15px;
  }

  .panel-description {
    color: #e2e8f0;
    margin: 0 0 15px 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  /* Input styling */
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
  }

  .input-group label {
    font-size: 0.95rem;
    color: #a0aec0;
    font-weight: 500;
  }

  input, select, textarea {
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #4a5568;
    background-color: #1a202c;
    color: white;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input:focus, select:focus, textarea:focus {
    border-color: #63b3ed;
    outline: none;
    box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.3);
  }

  textarea {
    resize: vertical;
    font-family: inherit;
    min-height: 100px;
  }

  /* Button styles */
  button {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    background-color: #4299e1;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  button:hover {
    background-color: #3182ce;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }

  button:disabled {
    background-color: #718096;
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;
    box-shadow: none;
  }

  .primary-button {
    background-color: #4c51bf;
    font-weight: 600;
    font-size: 1rem;
    padding: 14px 22px;
  }

  .primary-button:hover:not(:disabled) {
    background-color: #434190;
  }

  .secondary-button {
    background-color: #718096;
    font-weight: 500;
  }

  .secondary-button:hover:not(:disabled) {
    background-color: #4a5568;
  }

  .accent-button {
    background-color: #38a169;
    font-weight: 500;
  }

  .accent-button:hover:not(:disabled) {
    background-color: #2f855a;
  }

  .accent-button.active {
    background-color: #276749;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    transform: translateY(1px);
  }

  .feature-button {
    background-color: #4299e1;
    font-weight: 500;
    width: 100%;
    justify-content: center;
    margin-bottom: 10px;
  }

  .full-width {
    width: 100%;
  }

  .small-button {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
    backdrop-filter: blur(4px);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-container {
    background-color: #2d3748;
    border-radius: 12px;
    width: 90%;
    max-width: 700px;
    max-height: 85vh;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    border: 1px solid #4a5568;
  }

  @keyframes slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    border-bottom: 1px solid #4a5568;
  }

  .modal-header h2 {
    margin: 0;
    color: #63b3ed;
    font-size: 1.5rem;
  }

  .modal-close-button {
    background: transparent;
    border: none;
    color: #a0aec0;
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .modal-close-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: white;
    transform: none;
  }

  .modal-content {
    padding: 25px;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    padding: 20px 25px;
    border-top: 1px solid #4a5568;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }

  /* Loading spinner */
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(99, 179, 237, 0.3);
    border-radius: 50%;
    border-top-color: #63b3ed;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 20px 0;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .empty-icon {
    font-size: 4rem;
    margin: 20px 0;
    opacity: 0.6;
  }

  .empty-state p {
    color: #a0aec0;
    margin-bottom: 20px;
    font-size: 1.1rem;
  }

  /* Welcome panel styling */
  .welcome-panel {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border: 1px solid #4a5568;
  }

  .welcome-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .welcome-icon {
    font-size: 2.5rem;
    background-color: rgba(99, 179, 237, 0.2);
    height: 70px;
    width: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .welcome-text {
    flex: 1;
  }

  .welcome-text h1 {
    margin: 0 0 10px 0;
    color: #90cdf4;
    font-size: 1.8rem;
  }

  .token-highlight {
    color: #f6ad55;
    font-weight: bold;
    font-size: 1.1em;
  }

  /* Registration steps styling */
  .registration-steps {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin: 20px 0;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 15px;
    background-color: #1a202c;
    padding: 15px;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .step:hover {
    transform: translateX(5px);
  }

  .step.completed {
    border-left: 4px solid #48bb78;
  }

  .step.pending {
    border-left: 4px solid #ed8936;
  }

  .step.disabled {
    border-left: 4px solid #718096;
    opacity: 0.7;
  }

  .step-number {
    background-color: #2d3748;
    color: white;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
  }

  .step-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .step-title {
    font-weight: 600;
    font-size: 1.1rem;
  }

  .step-status {
    font-size: 0.9rem;
    color: #a0aec0;
  }

  .step-button {
    padding: 8px 16px;
    min-width: 100px;
  }

  .step-button.completed {
    background-color: #48bb78;
  }

  .step-button.pending {
    background-color: #ed8936;
  }

  /* Register banner */
  .register-banner {
    display: flex;
    align-items: center;
    gap: 20px;
    background: linear-gradient(135deg, #543db4 0%, #2e2270 100%);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .register-banner-icon {
    font-size: 2rem;
    background-color: rgba(255, 255, 255, 0.2);
    height: 60px;
    width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .register-banner-content {
    flex: 1;
  }

  .register-banner-content h2 {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
  }

  .register-banner-content p {
    margin: 0;
    opacity: 0.9;
  }

  .register-banner-button {
    background-color: white;
    color: #543db4;
    font-weight: 600;
    padding: 12px 20px;
    white-space: nowrap;
  }

  .register-banner-button:hover {
    background-color: #f7fafc;
  }

  /* Conversation styles */
  .conversation-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .conversation-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #1a202c;
    padding: 15px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .conversation-list li:hover {
    background-color: #2d3748;
    transform: translateX(5px);
  }

  .conversation-id {
    font-family: monospace;
    font-size: 0.9rem;
    color: #90cdf4;
    word-break: break-all;
  }

  .copy-btn {
    background-color: #4c51bf;
    padding: 8px 12px;
    font-size: 0.85rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* History container styling */
  .history-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .message {
    padding: 15px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .message.user {
    background-color: #2c4f83;
    align-self: flex-end;
    margin-left: 25px;
    border-bottom-right-radius: 0;
  }

  .message.assistant {
    background-color: #2d3748;
    align-self: flex-start;
    margin-right: 25px;
    border-bottom-left-radius: 0;
    border: 1px solid #4a5568;
  }

  .message.system {
    background-color: #553c9a;
    align-self: center;
    width: 80%;
    opacity: 0.9;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }

  .message-header strong {
    text-transform: capitalize;
  }

  .timestamp {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
  }

  .message-content {
    line-height: 1.5;
  }

  /* Token balance styling */
  .token-balance-card {
    background-color: #1a202c;
    padding: 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }

  .balance-label {
    color: #a0aec0;
    font-size: 1rem;
  }

  .balance-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: #f6ad55;
    flex: 1;
  }

  .token-info-list {
    list-style: none;
    padding: 0;
    margin: 15px 0;
  }

  .token-info-list li {
    padding: 10px 0;
    border-bottom: 1px solid #4a5568;
    position: relative;
    padding-left: 25px;
  }

  .token-info-list li:before {
    content: "•";
    color: #63b3ed;
    position: absolute;
    left: 0;
    font-size: 1.5rem;
    line-height: 1;
  }

  .token-info-list li:last-child {
    border-bottom: none;
  }

  /* Balance details styling */
  .balance-details {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .balance-card {
    background-color: #1a202c;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    border: 1px solid #4a5568;
  }

  .balance-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .balance-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .balance-icon {
    font-size: 1.4rem;
  }

  .balance-amount {
    font-size: 3rem;
    font-weight: 700;
    color: #f6ad55;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .balance-amount .balance-label {
    font-size: 1.2rem;
    font-weight: normal;
    color: #a0aec0;
  }

  /* Buy tokens styling */
  .buy-tokens-container {
    background-color: #1a202c;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 10px;
    border: 1px solid #4a5568;
  }

  .buy-amount-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .buy-amount-select {
    padding: 10px;
    border-radius: 6px;
    background-color: #2d3748;
    border: 1px solid #4a5568;
    color: white;
    flex: 1;
  }

  .buy-tokens-button {
    background-color: #38a169;
    width: 100%;
  }

  .buy-tokens-note {
    text-align: center;
    font-size: 0.85rem;
    color: #a0aec0;
    font-style: italic;
  }

  /* Token operations section */
  .token-operations-section {
    margin-top: 20px;
  }

  .token-operations-section h3 {
    margin-bottom: 15px;
    color: #90cdf4;
    font-size: 1.2rem;
  }

  /* Button grid */
  .button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 10px;
  }

  /* Media queries for responsiveness */
  @media (max-width: 1100px) {
    .two-column-layout {
      grid-template-columns: 1fr;
    }
    
    .button-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .welcome-content {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .panel {
      padding: 20px;
    }
    
    .message.user,
    .message.assistant {
      margin-left: 0;
      margin-right: 0;
    }
  }

  @media (max-width: 480px) {
    .balance-card-header, 
    .balance-details-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }

  /* Welcome tokens popup styling */
  .welcome-tokens-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 0;
  }

  .welcome-tokens-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    animation: pulse 2s infinite;
    background-color: rgba(237, 137, 54, 0.1);
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .welcome-tokens-message h3 {
    font-size: 1.5rem;
    color: #f6ad55;
    margin-bottom: 15px;
  }

  .welcome-tokens-message p {
    margin-bottom: 10px;
    line-height: 1.5;
  }

  .token-warning {
    margin-top: 15px;
    padding: 10px;
    background-color: rgba(237, 137, 54, 0.1);
    border-radius: 8px;
    display: flex;
    justify-content: center;
  }

  .claim-tokens-button {
    background-color: #ed8936;
    transition: all 0.3s;
    font-weight: 600;
  }

  .claim-tokens-button:hover {
    background-color: #dd6b20;
    transform: translateY(-2px);
  }

  /* Debug styling */
  .debug-buttons {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .debug-results {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  
  .token-check-result {
    background-color: #1a202c;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #4a5568;
  }
  
  .token-check-result h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #90cdf4;
  }
  
  .json-result {
    background-color: #2d3748;
    padding: 15px;
    border-radius: 8px;
    color: #f6e05e;
    font-family: monospace;
    white-space: pre-wrap;
    overflow-x: auto;
    margin-bottom: 15px;
  }
  
  .status-badge {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 30px;
    font-weight: 600;
    font-size: 1rem;
    margin-top: 10px;
  }
  
  .status-badge.success {
    background-color: rgba(72, 187, 120, 0.2);
    color: #48bb78;
    border: 1px solid #48bb78;
  }
  
  .status-badge.warning {
    background-color: rgba(237, 137, 54, 0.2);
    color: #ed8936;
    border: 1px solid #ed8936;
  }
  
  .debug-log {
    background-color: #1a202c;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #4a5568;
  }
  
  .debug-log h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #90cdf4;
  }
  
  .log-entries {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .log-entry {
    padding: 10px;
    background-color: #2d3748;
    border-radius: 8px;
  }
  
  .log-message {
    font-weight: 500;
    margin-bottom: 5px;
  }
  
  .log-data {
    font-family: monospace;
    font-size: 0.85rem;
    background-color: #1a202c;
    padding: 8px;
    border-radius: 4px;
    white-space: pre-wrap;
    overflow-x: auto;
  }

  .status-badge-mini {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 30px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-left: 10px;
  }
  
  .status-badge-mini.success {
    background-color: rgba(72, 187, 120, 0.2);
    color: #48bb78;
    border: 1px solid #48bb78;
  }
  
  .status-badge-mini.warning {
    background-color: rgba(237, 137, 54, 0.2);
    color: #ed8936;
    border: 1px solid #ed8936;
  }
  
  .status-badge-mini.fully-registered {
    background-color: rgba(72, 187, 120, 0.3);
    color: #48bb78;
    border: 1px solid #48bb78;
    font-weight: 700;
    animation: pulse 2s infinite;
  }

  /* Status check buttons and badges */
  .status-check-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .status-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
  }
  
  .registration-summary {
    margin-top: 20px;
    padding: 15px;
    background-color: rgba(72, 187, 120, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(72, 187, 120, 0.3);
  }
  
  .registration-summary h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #48bb78;
  }
  
  /* Registration notice and count badge */
  .registration-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    background-color: rgba(72, 187, 120, 0.1);
    border: 1px solid rgba(72, 187, 120, 0.3);
  }
  
  .registration-notice.success {
    color: #48bb78;
  }
  
  .registration-icon {
    font-size: 1.2rem;
  }
  
  .count-badge {
    background-color: #4c51bf;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    margin-left: 8px;
  }

  /* Onboarding Status Panel styling */
  .onboarding-status-section {
    margin-bottom: 20px;
  }
  
  .onboarding-status-panel {
    background: linear-gradient(145deg, #1a202c 0%, #2d3748 100%);
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    padding: 25px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 1px solid #4a5568;
    margin-bottom: 20px;
  }
  
  .onboarding-status-panel.complete {
    background: linear-gradient(145deg, #1e392a 0%, #2c5744 100%);
    border: 1px solid #38a169;
  }
  
  .onboarding-status-panel.claim_only {
    background: linear-gradient(145deg, #323214 0%, #4c4c28 100%);
    border: 1px solid #ecc94b;
  }
  
  .onboarding-status-panel.full_setup,
  .onboarding-status-panel.register_and_claim,
  .onboarding-status-panel.storage_and_claim {
    background: linear-gradient(145deg, #2a2651 0%, #3d3a75 100%);
    border: 1px solid #805ad5;
  }
  
  .onboarding-status-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .onboarding-status-icon {
    font-size: 2rem;
    background-color: rgba(255, 255, 255, 0.1);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .onboarding-status-message {
    flex: 1;
  }
  
  .onboarding-status-message h2 {
    margin: 0 0 10px 0;
    font-size: 1.5rem;
    color: #90cdf4;
  }
  
  .onboarding-status-message p {
    margin: 0 0 15px 0;
    font-size: 1.1rem;
    line-height: 1.5;
  }
  
  .onboarding-progress {
    margin-top: 15px;
  }
  
  .progress-bar {
    height: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4c51bf 0%, #6b46c1 100%);
    border-radius: 10px;
    transition: width 0.5s ease;
  }
  
  .progress-text {
    font-size: 0.9rem;
    color: #a0aec0;
  }
  
  .next-action-button {
    min-width: 180px;
    font-weight: 600;
    animation: pulse 2s infinite;
  }
  
  .onboarding-status-details {
    display: flex;
    gap: 10px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .status-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .status-item.completed {
    background-color: rgba(72, 187, 120, 0.2);
    border-left: 3px solid #48bb78;
  }
  
  .status-item.pending {
    background-color: rgba(160, 174, 192, 0.2);
    border-left: 3px solid #a0aec0;
  }
  
  .status-marker {
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
  }
  
  .status-label {
    font-weight: 500;
  }
`; 