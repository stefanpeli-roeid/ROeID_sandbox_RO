/**
 * Minimal in-memory StorageService for the Credo agent.
 *
 * The wallet simulator never persists Credo records across requests (MdocRecord.fromMdoc
 * builds records in-memory per-call), but Credo's Agent constructor requires a
 * StorageService to be registered in the dependency graph before it will construct at all
 * (repositories like MdocRepository/SdJwtVcRepository inject it eagerly). This provides
 * that backend without depending on Askar's native bindings.
 */
import {
  BaseRecord,
  BaseRecordConstructor,
  DependencyManager,
  InjectionSymbols,
  Module,
  Query,
  QueryOptions,
  RecordDuplicateError,
  RecordNotFoundError,
  StorageService,
} from '@credo-ts/core';

class InMemoryStorageService<T extends BaseRecord<any, any, any>> implements StorageService<T> {
  public readonly supportsCursorPagination = false;
  private records = new Map<string, T>();

  private key(recordClass: BaseRecordConstructor<T>, id: string): string {
    return `${recordClass.type}:${id}`;
  }

  async save(_agentContext: unknown, record: T): Promise<void> {
    const key = this.key(record.constructor as BaseRecordConstructor<T>, record.id);
    if (this.records.has(key)) {
      throw new RecordDuplicateError(`Record with id ${record.id} already exists`, { recordType: record.type });
    }
    this.records.set(key, record.clone());
  }

  async update(_agentContext: unknown, record: T): Promise<void> {
    const key = this.key(record.constructor as BaseRecordConstructor<T>, record.id);
    if (!this.records.has(key)) {
      throw new RecordNotFoundError(`Record with id ${record.id} not found`, { recordType: record.type });
    }
    this.records.set(key, record.clone());
  }

  async delete(_agentContext: unknown, record: T): Promise<void> {
    const key = this.key(record.constructor as BaseRecordConstructor<T>, record.id);
    if (!this.records.delete(key)) {
      throw new RecordNotFoundError(`Record with id ${record.id} not found`, { recordType: record.type });
    }
  }

  async deleteById(_agentContext: unknown, recordClass: BaseRecordConstructor<T>, id: string): Promise<void> {
    const key = this.key(recordClass, id);
    if (!this.records.delete(key)) {
      throw new RecordNotFoundError(`Record with id ${id} not found`, { recordType: recordClass.type });
    }
  }

  async getById(_agentContext: unknown, recordClass: BaseRecordConstructor<T>, id: string): Promise<T> {
    const record = this.records.get(this.key(recordClass, id));
    if (!record) {
      throw new RecordNotFoundError(`Record with id ${id} not found`, { recordType: recordClass.type });
    }
    return record.clone();
  }

  async getAll(_agentContext: unknown, recordClass: BaseRecordConstructor<T>): Promise<T[]> {
    return [...this.records.values()]
      .filter((record) => record.type === recordClass.type)
      .map((record) => record.clone());
  }

  async findByQuery(
    _agentContext: unknown,
    recordClass: BaseRecordConstructor<T>,
    query: Query<T>,
    _queryOptions?: QueryOptions
  ): Promise<T[]> {
    const tagQuery = query as Record<string, unknown>;
    return [...this.records.values()]
      .filter((record) => record.type === recordClass.type)
      .filter((record) => {
        const tags = record.getTags() as Record<string, unknown>;
        return Object.entries(tagQuery).every(([tagKey, tagValue]) => tags[tagKey] === tagValue);
      })
      .map((record) => record.clone());
  }
}

export class InMemoryStorageModule implements Module {
  register(dependencyManager: DependencyManager): void {
    dependencyManager.registerInstance(InjectionSymbols.StorageService, new InMemoryStorageService());
  }
}
