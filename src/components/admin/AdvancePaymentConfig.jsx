import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AdvancePaymentConfig.css';

const AdvancePaymentConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const queryClient = useQueryClient();

  // Fetch advance payment configurations
  const { data: configData, isLoading, error } = useQuery(
    'advance-payment-configs',
    adminAPI.getAdvancePaymentConfigs,
    {
      onSuccess: (data) => {
        setConfigs(data.data || []);
      }
    }
  );

  // Update configuration mutation
  const updateConfigMutation = useMutation(
    ({ category, data }) => adminAPI.updateAdvancePaymentConfig(category, data),
    {
      onSuccess: () => {
        toast.success('Configuration updated successfully');
        queryClient.invalidateQueries('advance-payment-configs');
        setEditingCategory(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update configuration');
      }
    }
  );

  // Bulk update mutation
  const bulkUpdateMutation = useMutation(
    adminAPI.bulkUpdateAdvancePaymentConfigs,
    {
      onSuccess: () => {
        toast.success('All configurations updated successfully');
        queryClient.invalidateQueries('advance-payment-configs');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update configurations');
      }
    }
  );

  const categoryNames = {
    sand: 'Sand',
    aggregate: 'Aggregate',
    cement: 'Cement',
    tmt_steel: 'TMT Steel',
    bricks_blocks: 'Bricks & Blocks'
  };

  const categoryIcons = {
    sand: '🏖️',
    aggregate: '🪨',
    cement: '🏗️',
    tmt_steel: '🔩',
    bricks_blocks: '🧱'
  };

  const handleAddPercentageOption = (categoryId) => {
    setConfigs(prev => prev.map(config => 
      config.category === categoryId
        ? {
            ...config,
            percentageOptions: [
              ...config.percentageOptions,
              { percentage: 25, label: 'New Option', isActive: true }
            ]
          }
        : config
    ));
  };

  const handleRemovePercentageOption = (categoryId, index) => {
    setConfigs(prev => prev.map(config => 
      config.category === categoryId
        ? {
            ...config,
            percentageOptions: config.percentageOptions.filter((_, i) => i !== index)
          }
        : config
    ));
  };

  const handleUpdatePercentageOption = (categoryId, index, field, value) => {
    setConfigs(prev => prev.map(config => 
      config.category === categoryId
        ? {
            ...config,
            percentageOptions: config.percentageOptions.map((option, i) => 
              i === index ? { ...option, [field]: value } : option
            )
          }
        : config
    ));
  };

  const handleUpdateDefaultPercentage = (categoryId, percentage) => {
    setConfigs(prev => prev.map(config => 
      config.category === categoryId
        ? { ...config, defaultPercentage: percentage }
        : config
    ));
  };

  const handleSaveCategory = async (categoryId) => {
    const config = configs.find(c => c.category === categoryId);
    if (!config) return;

    // Validation
    if (config.percentageOptions.length === 0) {
      toast.error('At least one percentage option is required');
      return;
    }

    const activeOptions = config.percentageOptions.filter(opt => opt.isActive);
    if (activeOptions.length === 0) {
      toast.error('At least one active percentage option is required');
      return;
    }

    const hasDefaultInActive = config.percentageOptions.some(
      opt => opt.percentage === config.defaultPercentage && opt.isActive
    );
    
    if (!hasDefaultInActive) {
      toast.error('Default percentage must be one of the active options');
      return;
    }

    try {
      await updateConfigMutation.mutateAsync({
        category: categoryId,
        data: {
          percentageOptions: config.percentageOptions,
          defaultPercentage: config.defaultPercentage
        }
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleBulkSave = async () => {
    const configsToUpdate = configs.map(config => ({
      category: config.category,
      percentageOptions: config.percentageOptions,
      defaultPercentage: config.defaultPercentage
    }));

    try {
      await bulkUpdateMutation.mutateAsync({ configs: configsToUpdate });
    } catch (error) {
      console.error('Failed to bulk update configurations:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="advance-config-loading">
        <RefreshCw className="spinning" size={24} />
        <p>Loading advance payment configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="advance-config-error">
        <AlertCircle size={24} />
        <h3>Failed to Load Configurations</h3>
        <p>{error.response?.data?.message || 'An error occurred while loading configurations'}</p>
      </div>
    );
  }

  return (
    <div className="advance-payment-config">
      <div className="config-header">
        <div className="header-content">
          <div className="header-info">
            <h2>
              <Settings size={24} />
              Advance Payment Configuration
            </h2>
            <p>Configure advance payment percentages for different product categories</p>
          </div>
          
          <div className="header-actions">
            <button
              className="btn-toggle-inactive"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? <EyeOff size={16} /> : <Eye size={16} />}
              {showInactive ? 'Hide' : 'Show'} Inactive Options
            </button>
            
            <button
              className="btn btn-primary"
              onClick={handleBulkSave}
              disabled={bulkUpdateMutation.isLoading}
            >
              {bulkUpdateMutation.isLoading ? <RefreshCw className="spinning" size={16} /> : <Save size={16} />}
              Save All Changes
            </button>
          </div>
        </div>
      </div>

      <div className="config-grid">
        {configs.map((config) => (
          <div key={config.category} className="category-config-card">
            <div className="card-header">
              <div className="category-info">
                <div className="category-icon">{categoryIcons[config.category]}</div>
                <div>
                  <h3>{categoryNames[config.category]}</h3>
                  <p className="category-description">
                    Default: {config.defaultPercentage}% • {config.percentageOptions?.filter(opt => opt.isActive).length || 0} options
                  </p>
                </div>
              </div>
              
              <div className="card-actions">
                <button
                  className={`btn-edit ${editingCategory === config.category ? 'active' : ''}`}
                  onClick={() => setEditingCategory(editingCategory === config.category ? null : config.category)}
                >
                  <Edit3 size={16} />
                  {editingCategory === config.category ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            <div className="card-content">
              {editingCategory === config.category ? (
                <div className="editing-mode">
                  <div className="percentage-options">
                    <div className="section-header">
                      <h4>Percentage Options</h4>
                      <button
                        className="btn-add-option"
                        onClick={() => handleAddPercentageOption(config.category)}
                      >
                        <Plus size={14} />
                        Add Option
                      </button>
                    </div>
                    
                    <div className="options-list">
                      {config.percentageOptions?.map((option, index) => (
                        <div 
                          key={index} 
                          className={`option-item ${!option.isActive && !showInactive ? 'hidden' : ''} ${!option.isActive ? 'inactive' : ''}`}
                        >
                          <div className="option-inputs">
                            <div className="input-group">
                              <label>Percentage</label>
                              <input
                                type="number"
                                min="10"
                                max="100"
                                value={option.percentage}
                                onChange={(e) => handleUpdatePercentageOption(
                                  config.category, 
                                  index, 
                                  'percentage', 
                                  parseInt(e.target.value)
                                )}
                              />
                              <span className="percentage-symbol">%</span>
                            </div>
                            
                            <div className="input-group">
                              <label>Label</label>
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => handleUpdatePercentageOption(
                                  config.category, 
                                  index, 
                                  'label', 
                                  e.target.value
                                )}
                                placeholder="Option label"
                              />
                            </div>
                            
                            <div className="input-group checkbox-group">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={option.isActive}
                                  onChange={(e) => handleUpdatePercentageOption(
                                    config.category, 
                                    index, 
                                    'isActive', 
                                    e.target.checked
                                  )}
                                />
                                Active
                              </label>
                            </div>
                          </div>
                          
                          <button
                            className="btn-remove-option"
                            onClick={() => handleRemovePercentageOption(config.category, index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="default-percentage-section">
                    <h4>Default Percentage</h4>
                    <select
                      value={config.defaultPercentage}
                      onChange={(e) => handleUpdateDefaultPercentage(config.category, parseInt(e.target.value))}
                      className="default-percentage-select"
                    >
                      {config.percentageOptions?.filter(opt => opt.isActive).map((option) => (
                        <option key={option.percentage} value={option.percentage}>
                          {option.percentage}% - {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="save-section">
                    <button
                      className="btn btn-success"
                      onClick={() => handleSaveCategory(config.category)}
                      disabled={updateConfigMutation.isLoading}
                    >
                      {updateConfigMutation.isLoading ? <RefreshCw className="spinning" size={16} /> : <CheckCircle size={16} />}
                      Save Configuration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="view-mode">
                  <div className="current-options">
                    <h4>Current Options</h4>
                    <div className="options-display">
                      {config.percentageOptions?.filter(opt => showInactive || opt.isActive).map((option, index) => (
                        <div 
                          key={index} 
                          className={`option-badge ${option.percentage === config.defaultPercentage ? 'default' : ''} ${!option.isActive ? 'inactive' : ''}`}
                        >
                          <span className="percentage">{option.percentage}%</span>
                          <span className="label">{option.label}</span>
                          {option.percentage === config.defaultPercentage && <span className="default-indicator">Default</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="config-summary">
                    <div className="summary-item">
                      <span className="label">Total Options:</span>
                      <span className="value">{config.percentageOptions?.length || 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Active Options:</span>
                      <span className="value">{config.percentageOptions?.filter(opt => opt.isActive).length || 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Last Updated:</span>
                      <span className="value">
                        {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="config-info">
        <div className="info-card">
          <AlertCircle size={20} />
          <div>
            <h4>Important Notes</h4>
            <ul>
              <li>Default percentage must be one of the active options</li>
              <li>At least one active option is required per category</li>
              <li>Percentage range: 10% - 100%</li>
              <li>Changes apply to new orders immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancePaymentConfig;