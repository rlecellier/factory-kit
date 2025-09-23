import { createFactory } from '@/factory';
import { resetSequence, sequence } from '@/sequence';
import { clearAllUniqueStores, unique } from '@/unique';
import { faker } from '@faker-js/faker';

describe('Factory.inheritance', () => {
  // Reset sequences and unique stores before each test
  beforeEach(() => {
    resetSequence();
    clearAllUniqueStores();
  });
  interface Person {
    name: string;
    email: string;
    age: number;
  }

  interface Employee extends Person {
    employeeId: number;
    department: string;
    hireDate: Date;
  }

  interface Manager extends Employee {
    subordinates: string[];
    level: string;
  }

  it('should allow extending a factory to create inherited types', () => {
    // Base person factory
    const personFactory = createFactory<Person>().define({
      name: () => faker.person.fullName(),
      email: () => faker.internet.email(),
      age: () => faker.number.int({ min: 18, max: 65 }),
    });

    // Employee extends Person with additional attributes
    const employeeFactory = personFactory.extend<Employee>().define({
      employeeId: () => faker.number.int(),
      department: () => faker.commerce.department(),
      hireDate: () => faker.date.past(),
    });

    // Manager extends Employee with additional attributes
    const managerFactory = employeeFactory.extend<Manager>().define({
      subordinates: () => [],
      level: 'middle',
    });

    const manager = managerFactory.build();

    // Should have all Person attributes
    expect(manager.name).toEqual(expect.any(String));
    expect(manager.email).toEqual(expect.any(String));
    expect(manager.age).toEqual(expect.any(Number));
    expect(manager.age).toBeGreaterThanOrEqual(18);
    expect(manager.age).toBeLessThanOrEqual(65);

    // Should have all Employee attributes
    expect(manager.employeeId).toEqual(expect.any(Number));
    expect(manager.department).toEqual(expect.any(String));
    expect(manager.hireDate).toEqual(expect.any(Date));

    // Should have all Manager attributes
    expect(manager.subordinates).toEqual([]);
    expect(manager.level).toBe('middle');
  });

  it('should inherit traits from parent factories', () => {
    const personFactory = createFactory<Person>()
      .define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      })
      .trait('senior', {
        age: () => faker.number.int({ min: 60, max: 80 }),
      });

    const employeeFactory = personFactory.extend<Employee>().define({
      employeeId: () => faker.number.int(),
      department: () => faker.commerce.department(),
      hireDate: () => faker.date.past(),
    });

    const seniorEmployee = employeeFactory.build({ traits: ['senior'] });

    expect(seniorEmployee.age).toBeGreaterThanOrEqual(60);
    expect(seniorEmployee.age).toBeLessThanOrEqual(80);
    expect(seniorEmployee.employeeId).toEqual(expect.any(Number));
    expect(seniorEmployee.department).toEqual(expect.any(String));
  });

  describe('buildMany with inheritance', () => {
    it('should build multiple instances of inherited types', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: () => faker.number.int(),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
        age: 35,
      });

      const employees = employeeFactory.buildMany(3);

      expect(employees).toHaveLength(3);

      employees.forEach((employee) => {
        // Should have all Person attributes
        expect(employee.name).toEqual(expect.any(String));
        expect(employee.email).toEqual(expect.any(String));
        expect(employee.age).toEqual(35);

        // Should have all Employee attributes
        expect(employee.employeeId).toEqual(expect.any(Number));
        expect(employee.department).toEqual(expect.any(String));
        expect(employee.hireDate).toEqual(expect.any(Date));
      });

      // All employees should be different
      expect(employees[0].employeeId).not.toEqual(employees[1].employeeId);
      expect(employees[0].email).not.toEqual(employees[1].email);
    });
  });

  describe('manual overrides with inheritance', () => {
    it('should support overriding inherited attributes', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: () => faker.number.int(),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
      });

      const employee = employeeFactory.build({
        overrides: {
          name: 'John Doe',
          age: 35,
          department: 'Engineering',
          employeeId: 12345,
        },
      });

      expect(employee.name).toBe('John Doe');
      expect(employee.age).toBe(35);
      expect(employee.department).toBe('Engineering');
      expect(employee.employeeId).toBe(12345);
      expect(employee.email).toEqual(expect.any(String)); // Should still be generated
      expect(employee.hireDate).toEqual(expect.any(Date)); // Should still be generated
    });

    it('should support overriding attributes in multiple inheritance levels', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: () => faker.number.int(),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
      });

      const managerFactory = employeeFactory.extend<Manager>().define({
        subordinates: () => [],
        level: 'middle',
      });

      const manager = managerFactory.build({
        overrides: {
          name: 'Jane Smith', // Person attribute
          department: 'Sales', // Employee attribute
          level: 'senior', // Manager attribute
        },
      });

      expect(manager.name).toBe('Jane Smith');
      expect(manager.department).toBe('Sales');
      expect(manager.level).toBe('senior');
    });
  });

  describe('nested overrides with inheritance', () => {
    interface Address {
      street: string;
      city: string;
      zipCode: string;
    }

    interface PersonWithAddress extends Person {
      address: Address;
      preferences: {
        theme: string;
        notifications: boolean;
      };
    }

    interface EmployeeWithDetails extends PersonWithAddress {
      employeeId: number;
      department: string;
      workAddress: Address;
    }

    it('should support nested overrides in inherited factories', () => {
      const personFactory = createFactory<PersonWithAddress>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          zipCode: faker.location.zipCode(),
        },
        preferences: {
          theme: 'light',
          notifications: true,
        },
      });

      const employeeFactory = personFactory
        .extend<EmployeeWithDetails>()
        .define({
          employeeId: () => faker.number.int(),
          department: () => faker.commerce.department(),
          workAddress: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            zipCode: faker.location.zipCode(),
          },
        });

      const employee = employeeFactory.build({
        overrides: {
          name: 'John Doe',
          address__street: '123 Main St',
          address__city: 'New York',
          preferences__theme: 'dark',
          workAddress__street: '456 Work Ave',
          department: 'Engineering',
        },
      });

      expect(employee.name).toBe('John Doe');
      expect(employee.address.street).toBe('123 Main St');
      expect(employee.address.city).toBe('New York');
      expect(employee.preferences.theme).toBe('dark');
      expect(employee.preferences.notifications).toBe(true); // Should remain unchanged
      expect(employee.workAddress.street).toBe('456 Work Ave');
      expect(employee.department).toBe('Engineering');
    });
  });

  describe('attribute functions with inheritance', () => {
    it('should support attribute functions that depend on inherited attributes', () => {
      const personFactory = createFactory<Person>().define({
        name: 'John Smith', // Use static value to ensure predictable result
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: () => faker.number.int(),
        department: 'Engineering', // Use static value to ensure predictable result
        hireDate: () => faker.date.past(),
      });

      interface EmployeeWithEmail extends Employee {
        workEmail: string;
        displayName: string;
      }

      const extendedEmployeeFactory = employeeFactory
        .extend<EmployeeWithEmail>()
        .define({
          workEmail: ({ name }) =>
            `${(name || '').toLowerCase().replace(' ', '.')}@company.com`,
          displayName: ({ name, department }) => `${name} (${department})`,
        });

      const employee = extendedEmployeeFactory.build();

      expect(employee.workEmail).toBe('john.smith@company.com');
      expect(employee.displayName).toBe('John Smith (Engineering)');
    });
  });

  describe('direct faker function usage with inheritance', () => {
    it('should support direct faker functions in inherited factories', () => {
      interface PersonWithBio extends Person {
        bio: string;
        avatar: string;
      }

      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const personWithBioFactory = personFactory
        .extend<PersonWithBio>()
        .define({
          bio: faker.lorem.paragraph(),
          avatar: faker.image.avatar(),
        });

      const person = personWithBioFactory.build();

      expect(person.name).toEqual(expect.any(String));
      expect(person.email).toEqual(expect.any(String));
      expect(person.age).toEqual(expect.any(Number));
      expect(person.bio).toEqual(expect.any(String));
      expect(person.avatar).toEqual(expect.any(String));
    });
  });

  describe('sequence integration with inheritance', () => {
    it('should work with sequence in inherited factories', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: sequence((n) => n + 1000),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
      });

      const employee1 = employeeFactory.build();
      const employee2 = employeeFactory.build();
      const employee3 = employeeFactory.build();

      expect(employee1.employeeId).toBe(1001);
      expect(employee2.employeeId).toBe(1002);
      expect(employee3.employeeId).toBe(1003);
    });

    it('should maintain separate sequences for different inherited factories', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: sequence((n) => n + 1000, { id: 'employee' }),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
      });

      const managerFactory = employeeFactory.extend<Manager>().define({
        subordinates: sequence((n) => [`emp-${n}`, `emp-${n + 1}`], {
          id: 'manager',
        }),
        level: 'middle',
      });

      const employee = employeeFactory.build();
      const manager = managerFactory.build();
      const employee2 = employeeFactory.build();

      expect(employee.employeeId).toBe(1001);
      expect(manager.employeeId).toBe(1002); // Continues employee sequence
      expect(manager.subordinates).toEqual(['emp-1', 'emp-2']); // Manager sequence starts at 1
      expect(employee2.employeeId).toBe(1003); // Continues employee sequence
    });
  });

  describe('unique integration with inheritance', () => {
    it('should work with unique in inherited factories', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: unique(() => faker.internet.email().toLowerCase(), 'email'),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: unique(
          () => faker.number.int({ min: 1000, max: 9999 }),
          'employeeId'
        ),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
      });

      const employees = employeeFactory.buildMany(3);

      // All emails should be unique
      const emails = employees.map((emp) => emp.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(3);

      // All employee IDs should be unique
      const employeeIds = employees.map((emp) => emp.employeeId);
      const uniqueEmployeeIds = new Set(employeeIds);
      expect(uniqueEmployeeIds.size).toBe(3);
    });

    it('should maintain unique constraints across inheritance levels', () => {
      const personFactory = createFactory<Person>().define({
        name: () => faker.person.fullName(),
        email: unique(() => faker.internet.email().toLowerCase(), 'email'),
        age: () => faker.number.int({ min: 18, max: 65 }),
      });

      const employeeFactory = personFactory.extend<Employee>().define({
        employeeId: unique(
          () => faker.number.int({ min: 1000, max: 9999 }),
          'employeeId'
        ),
        department: () => faker.commerce.department(),
        hireDate: () => faker.date.past(),
      });

      const managerFactory = employeeFactory.extend<Manager>().define({
        subordinates: () => [],
        level: unique(
          () => faker.helpers.arrayElement(['junior', 'middle', 'senior']),
          'level'
        ),
      });

      // Build instances from both factories
      const employee = employeeFactory.build();
      const manager = managerFactory.build();
      const employee2 = employeeFactory.build();

      // All emails should be unique across all instances
      expect(employee.email).not.toBe(manager.email);
      expect(employee.email).not.toBe(employee2.email);
      expect(manager.email).not.toBe(employee2.email);

      // All employee IDs should be unique across all instances
      expect(employee.employeeId).not.toBe(manager.employeeId);
      expect(employee.employeeId).not.toBe(employee2.employeeId);
      expect(manager.employeeId).not.toBe(employee2.employeeId);
    });
  });

  describe('multiple trait application with inheritance', () => {
    it('should support applying multiple traits from different inheritance levels', () => {
      const personFactory = createFactory<Person>()
        .define({
          name: () => faker.person.fullName(),
          email: () => faker.internet.email(),
          age: () => faker.number.int({ min: 18, max: 65 }),
        })
        .trait('senior', {
          age: () => faker.number.int({ min: 60, max: 80 }),
        })
        .trait('vip', {
          email: () => 'vip.special@company.com', // Use a predictable value
        });

      const employeeFactory = personFactory
        .extend<Employee>()
        .define({
          employeeId: () => faker.number.int(),
          department: () => faker.commerce.department(),
          hireDate: () => faker.date.past(),
        })
        .trait('remote', {
          department: 'Remote - Engineering',
        })
        .trait('contractor', {
          employeeId: () => faker.number.int({ min: 90000, max: 99999 }),
          hireDate: () => faker.date.recent(),
        });

      const employee = employeeFactory.build({
        traits: ['senior', 'vip', 'remote', 'contractor'],
      });

      // Should apply all traits
      expect(employee.age).toBeGreaterThanOrEqual(60); // senior trait
      expect(employee.age).toBeLessThanOrEqual(80); // senior trait
      expect(employee.email).toBe('vip.special@company.com'); // vip trait
      expect(employee.department).toBe('Remote - Engineering'); // remote trait
      expect(employee.employeeId).toBeGreaterThanOrEqual(90000); // contractor trait
      expect(employee.employeeId).toBeLessThanOrEqual(99999); // contractor trait
    });
  });

  describe('trait inheritance chain', () => {
    it('should inherit traits through multiple levels', () => {
      const personFactory = createFactory<Person>()
        .define({
          name: () => faker.person.fullName(),
          email: () => faker.internet.email(),
          age: () => faker.number.int({ min: 18, max: 65 }),
        })
        .trait('senior', {
          age: () => faker.number.int({ min: 60, max: 80 }),
        });

      const employeeFactory = personFactory
        .extend<Employee>()
        .define({
          employeeId: () => faker.number.int(),
          department: () => faker.commerce.department(),
          hireDate: () => faker.date.past(),
        })
        .trait('experienced', {
          hireDate: () => faker.date.past({ years: 5 }),
        });

      const managerFactory = employeeFactory
        .extend<Manager>()
        .define({
          subordinates: () => [],
          level: 'middle',
        })
        .trait('executive', {
          level: 'executive',
          subordinates: () => ['emp1', 'emp2', 'emp3'],
        });

      const manager = managerFactory.build({
        traits: ['senior', 'experienced', 'executive'],
      });

      // Should inherit and apply traits from all levels
      expect(manager.age).toBeGreaterThanOrEqual(60); // senior trait from Person
      expect(manager.age).toBeLessThanOrEqual(80); // senior trait from Person
      expect(manager.hireDate.getFullYear()).toBeLessThanOrEqual(
        new Date().getFullYear()
      ); // experienced trait from Employee - should be in the past
      expect(manager.level).toBe('executive'); // executive trait from Manager
      expect(manager.subordinates).toEqual(['emp1', 'emp2', 'emp3']); // executive trait from Manager
    });
  });

  describe('complex inheritance scenarios', () => {
    interface ContactInfo {
      phone: string;
      address: {
        street: string;
        city: string;
        state: string;
      };
    }

    interface PersonWithContact extends Person, ContactInfo {}

    interface EmployeeWithContact extends PersonWithContact, Employee {
      workPhone: string;
      workAddress: {
        street: string;
        city: string;
        state: string;
      };
    }

    it('should handle complex inheritance with multiple interfaces', () => {
      const personFactory = createFactory<PersonWithContact>().define({
        name: () => faker.person.fullName(),
        email: () => faker.internet.email(),
        age: () => faker.number.int({ min: 18, max: 65 }),
        phone: () => faker.phone.number(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
        },
      });

      const employeeFactory = personFactory
        .extend<EmployeeWithContact>()
        .define({
          employeeId: () => faker.number.int(),
          department: () => faker.commerce.department(),
          hireDate: () => faker.date.past(),
          workPhone: () => faker.phone.number(),
          workAddress: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
          },
        });

      const employee = employeeFactory.build({
        overrides: {
          name: 'John Smith',
          address__city: 'New York',
          workAddress__city: 'San Francisco',
        },
      });

      expect(employee.name).toBe('John Smith');
      expect(employee.address.city).toBe('New York');
      expect(employee.workAddress.city).toBe('San Francisco');
      expect(employee.phone).toEqual(expect.any(String));
      expect(employee.workPhone).toEqual(expect.any(String));
      expect(employee.employeeId).toEqual(expect.any(Number));
    });
  });
});
