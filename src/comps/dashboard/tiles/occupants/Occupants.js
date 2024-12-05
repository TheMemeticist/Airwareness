import React from 'react';
import { useAppContext } from '../../../../context/AppContext';
import Tile from '../Tile';
import styles from './Occupants.module.css';
import tileStyles from '../Tile.module.css';
import { Box, TextField, IconButton, Slider, Typography, Stack, Button } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Article as ArticleIcon } from '@mui/icons-material';
import { PeopleIcon, HotelIcon, DirectionsRunIcon, DirectionsWalkIcon, AccessibilityNewIcon, SittingIcon } from './OccupantIcons';
import { styled, TextFieldProps } from '@mui/material/styles';
import descriptionStyles from '../TileDescriptions.module.css';

// Add this custom styled component
const WhiteTextField = styled((props: TextFieldProps) => (
  <TextField {...props} />
))({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'white',
    },
    '&:hover fieldset': {
      borderColor: 'white',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'white',
    },
  },
  '& .MuiInputBase-input': {
    color: 'white',
  },
  '& .MuiInputLabel-root': {
    color: 'white',
  },
});

const Occupants = ({ buildingId, roomId }) => {
  const { state, dispatch } = useAppContext();
  const room = state.buildings
    .find(b => b.id === buildingId)
    ?.rooms.find(r => r.id === roomId);

  const { groups, activityLevel, maskRate, maskFiltration } = room?.occupants || { groups: [], activityLevel: 2, maskRate: 0, maskFiltration: 0 };

  const updateOccupants = (newGroups, newActivityLevel, newMaskRate, newMaskFiltration) => {
    dispatch({
      type: 'UPDATE_OCCUPANTS',
      payload: {
        buildingId,
        roomId,
        occupants: {
          groups: newGroups,
          activityLevel: newActivityLevel,
          maskRate: newMaskRate,
          maskFiltration: newMaskFiltration
        }
      }
    });
  };

  const addGroup = () => {
    if (groups.length === 0) {
      console.log('Initializing default classroom');
      const defaultGroups = [
        { name: 'Teacher', count: 1, age: '35' },
        { name: 'Students', count: 22, age: '13' }
      ];
      console.log('Default groups:', defaultGroups);
      updateOccupants(defaultGroups, 2, 0, 0);
    } else {
      updateOccupants([...groups, { name: `Group ${groups.length + 1}`, count: 1, age: '18' }], activityLevel, maskRate, maskFiltration);
    }
  };

  const removeGroup = (index) => {
    if (groups.length > 1) {
      updateOccupants(groups.filter((_, i) => i !== index), activityLevel, maskRate, maskFiltration);
    }
  };

  const updateGroup = (index, field, value) => {
    const newGroups = [...groups];
    newGroups[index][field] = value;
    updateOccupants(newGroups, activityLevel, maskRate, maskFiltration);
  };

  const getActivityIcon = (activity) => {
    if (activity === 1) return <HotelIcon />;
    if (activity === 2) return <SittingIcon />;
    if (activity === 3) return <AccessibilityNewIcon />;
    if (activity === 4) return <DirectionsWalkIcon />;
    return <DirectionsRunIcon />;
  };

  const getActivityLabel = (activity) => {
    if (activity === 1) return 'Sleeping';
    if (activity === 2) return 'Sitting';
    if (activity === 3) return 'Standing';
    if (activity === 4) return 'Walking';
    return 'Running';
  };

  const totalOccupants = groups.reduce((sum, group) => sum + group.count, 0);

  const activityIcons = [
    { icon: <HotelIcon />, label: 'Sleeping' },
    { icon: <SittingIcon />, label: 'Sitting' },
    { icon: <AccessibilityNewIcon />, label: 'Standing' },
    { icon: <DirectionsWalkIcon />, label: 'Walking' },
    { icon: <DirectionsRunIcon />, label: 'Running' },
  ];

  return (
    <Tile 
      title="Occupants" 
      collapsible={true} 
      icon={<PeopleIcon className={styles['tile-icon']} />}
      count={totalOccupants}
      helpText="Manage occupant groups, activity levels, and mask usage in this room."
    >
      {({ isCollapsed }) => (
        <>
          {isCollapsed && (
            <div className={styles['collapsed-content']}>
              <div className={styles['minimized-icon']}>
                <PeopleIcon sx={{ fontSize: '80px' }} />
              </div>
              <Typography className={styles['collapsed-number']}>
                {totalOccupants}
              </Typography>
            </div>
          )}
          {!isCollapsed && (
            <div className={`${tileStyles['tile-content']} ${styles['occupants-container']}`}>
              {/* <Box className={styles['activity-slider-container']}>
                <Box className={styles['activity-icons']}>
                  {activityIcons.map((item, index) => (
                    <div key={index} className={`${styles['activity-icon']} ${activityLevel === index + 1 ? styles['active'] : ''}`}>
                      {item.icon}
                    </div>
                  ))}
                </Box>
                <Slider
                  value={activityLevel}
                  onChange={(_, newValue) => updateOccupants(groups, newValue, maskRate, maskFiltration)}
                  min={1}
                  max={5}
                  step={1}
                  marks
                  className={styles['activity-slider']}
                />
                <Typography className={styles['activity-label']}>
                  {activityIcons[activityLevel - 1].label}
                </Typography>
              </Box> */}
              {/* <Box className={styles['mask-options-container']}>
                <WhiteTextField
                  className={styles['mask-input']}
                  label="Mask Rate (%)"
                  type="number"
                  value={maskRate}
                  onChange={(e) => updateOccupants(groups, activityLevel, parseFloat(e.target.value) || 0, maskFiltration)}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
                <WhiteTextField
                  className={styles['mask-input']}
                  label="Mask Filtration (%)"
                  type="number"
                  value={maskFiltration}
                  onChange={(e) => updateOccupants(groups, activityLevel, maskRate, parseFloat(e.target.value) || 0)}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Box> */}
              <Box className={styles['groups-container']} sx={{ maxHeight: 200, overflowY: 'auto' }}>
                <Stack spacing={2}>
                  {groups.map((group, index) => (
                    <Box key={index} className={styles['group-row']}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WhiteTextField
                          className={styles['group-input']}
                          label="Group Name"
                          value={group.name}
                          onChange={(e) => updateGroup(index, 'name', e.target.value)}
                          variant="outlined"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                        <WhiteTextField
                          className={styles['group-input']}
                          label="Count"
                          type="number"
                          value={group.count}
                          onChange={(e) => updateGroup(index, 'count', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                        <WhiteTextField
                          className={styles['group-input']}
                          label="Avg. Age"
                          type="number"
                          value={group.age}
                          onChange={(e) => updateGroup(index, 'age', e.target.value)}
                          variant="outlined"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        {groups.length > 1 && (
                          <IconButton onClick={() => removeGroup(index)} className={styles['remove-group-button']}>
                            <RemoveIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
              <IconButton onClick={addGroup} className={styles['add-group-button']}>
                <AddIcon />
              </IconButton>

              <div className={descriptionStyles['description-container']} >
                <Typography 
                  variant="body2" 
                  color="white" 
                  className={descriptionStyles['description-primary']}
                >
                  <p><strong>Occupant Management System:</strong> This interface allows you to configure detailed information about room occupants, organizing them into distinct groups with specific characteristics.</p>
                  
                  <p>Each group can be customized with a name, count, and average age. This granular approach enables more accurate risk assessments by accounting for different occupant demographics and their varying susceptibilities to airborne transmission.</p>

                  <Button
                    variant="contained"
                    className={descriptionStyles['source-button']}
                    href="https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0253096"
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<ArticleIcon />}
                  >
                    Learn more about occupancy and transmission
                  </Button>
                </Typography>
              </div>
            </div>
          )}
        </>
      )}
    </Tile>
  );
};

export default Occupants;
