import request from 'supertest';
import app from '../server';
import Author from '../models/author';

describe('GET /authors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a sorted list of authors (by family name) with their lifetimes when authors exist', async () => {
    const authorsData = [
      {
        first_name: 'John',
        family_name: 'Doe',
        date_of_birth: new Date('1989-01-09'),
        date_of_death: new Date('2018-01-01'),
      },
      {
        first_name: 'Alice',
        family_name: 'Brown',
        date_of_birth: new Date('1980-05-05'),
        date_of_death: new Date('2020-05-05'),
      },
      {
        first_name: 'Bob',
        family_name: 'Clark',
        date_of_birth: new Date('1975-03-03'),
        date_of_death: new Date('2015-03-03'),
      }
    ];
    const authorsInstances = authorsData.map(data => new Author(data));

    // Sort the instances by family name (ascending)
    const sortedAuthorsInstances = [...authorsInstances].sort((a, b) =>
      a.family_name.localeCompare(b.family_name)
    );

    // The service returns each author as a string: "name : lifespan"
    const expectedSorted = sortedAuthorsInstances.map(
      author => `${author.name} : ${author.lifespan}`
    );

    // Mock Author.find() to return a query-like object with a sort() method.
    jest.spyOn(Author, 'find').mockImplementation(() => {
      return {
        sort: jest.fn().mockResolvedValue(sortedAuthorsInstances)
      } as any;
    });

    const response = await request(app).get('/authors');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(expectedSorted);
  });

  it('should respond with "No authors found" when the database returns an empty list', async () => {
    jest.spyOn(Author, 'find').mockImplementation(() => {
      return {
        sort: jest.fn().mockResolvedValue([])
      } as any;
    });

    const response = await request(app).get('/authors');

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("No authors found");
  });

  it('should respond with "No authors found" when there is an error retrieving authors', async () => {
    jest.spyOn(Author, 'find').mockImplementation(() => {
      return {
        sort: jest.fn().mockRejectedValue(new Error("DB Error"))
      } as any;
    });

    const response = await request(app).get('/authors');

    // res.send('No authors found')
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("No authors found");
  });
});
