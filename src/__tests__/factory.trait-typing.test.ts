import { faker } from '@faker-js/faker';
import { createFactory, unique } from '../index';

interface SpotBase {
  footprintId: string;
  isToControl: boolean;
  isAvailable: boolean;
  isOccupied: boolean;
}

interface ToControlSpot extends Omit<SpotBase, 'isToControl'> {
  isToControl: true;
}

interface OccupiedSpot extends Omit<SpotBase, 'isOccupied'> {
  isOccupied: true;
}

type Spot = ToControlSpot | OccupiedSpot;

describe('Factory typing fix for union types with traits', () => {
  it('should allow type narrowing with explicit type parameter', () => {
    const SpotFactory = createFactory<Spot>()
      .define({
        footprintId: unique(() => faker.string.uuid(), 'footprint-id'),
        isToControl: () => false,
        isAvailable: () => false,
        isOccupied: () => false,
      })
      .trait('tocontrol', {
        isToControl: () => true,
      })
      .trait('occupied', {
        isOccupied: () => true,
      });

    // Now with explicit type parameters, we get properly narrowed types
    const toControlSpot = SpotFactory.build<ToControlSpot>({
      traits: ['tocontrol'],
    });
    const occupiedSpot = SpotFactory.build<OccupiedSpot>({
      traits: ['occupied'],
    });

    // These should be properly typed and work at runtime
    const _typeCheck1: ToControlSpot = toControlSpot;
    const _typeCheck2: OccupiedSpot = occupiedSpot;

    expect(toControlSpot.isToControl).toBe(true);
    expect(occupiedSpot.isOccupied).toBe(true);
    expect(_typeCheck1).toBeDefined();
    expect(_typeCheck2).toBeDefined();
  });

  it('should work with buildMany and array types', () => {
    const SpotFactory = createFactory<Spot>()
      .define({
        footprintId: unique(() => faker.string.uuid(), 'footprint-many'),
        isToControl: () => false,
        isAvailable: () => false,
        isOccupied: () => false,
      })
      .trait('tocontrol', {
        isToControl: () => true,
      })
      .trait('occupied', {
        isOccupied: () => true,
      });

    // With explicit type parameters, arrays are also properly typed
    const toControlSpots = SpotFactory.buildMany<ToControlSpot>(2, {
      traits: ['tocontrol'],
    });
    const occupiedSpots = SpotFactory.buildMany<OccupiedSpot>(2, {
      traits: ['occupied'],
    });

    // Type check the arrays
    const _typeCheck1: ToControlSpot[] = toControlSpots;
    const _typeCheck2: OccupiedSpot[] = occupiedSpots;

    expect(toControlSpots).toHaveLength(2);
    expect(occupiedSpots).toHaveLength(2);

    toControlSpots.forEach((spot) => {
      expect(spot.isToControl).toBe(true);
    });

    occupiedSpots.forEach((spot) => {
      expect(spot.isOccupied).toBe(true);
    });

    expect(_typeCheck1).toBeDefined();
    expect(_typeCheck2).toBeDefined();
  });

  it('should maintain backward compatibility without explicit types', () => {
    const SpotFactory = createFactory<Spot>()
      .define({
        footprintId: unique(() => faker.string.uuid(), 'footprint-compat'),
        isToControl: () => false,
        isAvailable: () => false,
        isOccupied: () => false,
      })
      .trait('tocontrol', {
        isToControl: () => true,
      });

    // Without explicit type parameter, it still works as before (returns Spot)
    const spot = SpotFactory.build({ traits: ['tocontrol'] });
    const spots = SpotFactory.buildMany(2, { traits: ['tocontrol'] });

    expect(spot.isToControl).toBe(true);
    expect(spots).toHaveLength(2);
    spots.forEach((s) => {
      expect(s.isToControl).toBe(true);
    });
  });
});
